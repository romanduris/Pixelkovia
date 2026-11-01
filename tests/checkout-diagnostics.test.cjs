const assert=require('node:assert/strict');
const {launch,open}=require('./helpers/inline-checkout.cjs');
(async()=>{const browser=await launch();try{
  for(const query of ['','?product=story-book-before','?product=story-book-after']){
    const t=await open(browser,{query,validationError:true});await t.start();await t.page.locator('#stripe-pay').click();
    await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
    await t.page.waitForTimeout(50);
    assert.ok(t.f.diagnostics.some(d=>d.type==='validation_error'));
    assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),0);
    const content=JSON.stringify(t.f.diagnostics);for(const value of ['family@example.invalid','clientSecret','fixture_secret','Číslo vašej karty'])assert.ok(!content.includes(value));
    await t.close();
  }
  const t=await open(browser,{diagnosticError:true});await t.start();await t.page.locator('#stripe-pay').click();
  await t.page.waitForFunction(()=>inlineFixture.calls.length===1);t.f.paid=true;await t.finish();
  await t.page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));
  assert.ok(t.f.diagnostics.some(d=>d.type==='confirm_started'));await t.close();
  const broken=await open(browser,{cardLoadError:true});await broken.start();await broken.page.waitForTimeout(50);assert.ok(broken.f.diagnostics.some(d=>d.type==='element_error'));await broken.close();
  console.log('PASS: diagnostics on game and both books, privacy, field validation, load failure and successful payment when diagnostic requests fail');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
