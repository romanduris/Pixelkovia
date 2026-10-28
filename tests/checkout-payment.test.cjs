const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine={chromium,webkit}[process.env.QA_BROWSER||'chromium'];
assert.ok(engine,'QA_BROWSER must be chromium or webkit');
const origin='https://pixelkovia.rodulab.com';
function installStripeStub(scenario){
 const state=window.checkoutFixture={calls:[],destroyed:0,finish:null,stale:null};
 window.Stripe=()=>({initCheckoutFormSdk:()=>({
  async loadActions(){return scenario==='load-error'?{type:'error'}:{type:'success',actions:{confirm(options){
   state.calls.push({redirect:options.redirect,formEvent:options.formConfirmEvent?.fixture===true});
   return new Promise((resolve,reject)=>{state.finish=result=>result.throw?reject(Error('Fixture network outage')):resolve(result);});
  }}};},
  createForm(options){
   state.formOptions=options;
   let handler;const pay=document.createElement('button');pay.type='button';pay.textContent='Fixture pay';
   pay.addEventListener('click',()=>handler({fixture:true}));
   return {on(event,fn){assertEvent(event);handler=fn;state.stale=fn;},mount(selector){document.querySelector(selector).append(pay);},destroy(){state.destroyed++;pay.remove();}};
  }
 })});
 function assertEvent(event){if(event!=='confirm')throw Error('Unexpected Stripe form event.');}
}
(async()=>{
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 const cases=[];
 async function open(scenario='normal',paid=false,returned=false,width=390,baseId='episode-1'){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600}),page=await context.newPage();
  const fixture={posts:[],reads:0,paid,delivered:false};
  await page.addInitScript(installStripeStub,scenario);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin)return route.abort();
   if(url.pathname==='/api/checkout/config')return route.fulfill({json:{enabled:scenario!=='disabled',publishableKey:'pk_test_fixture'}});
   if(url.pathname==='/api/checkout/session'){
    fixture.posts.push(route.request().postDataJSON());
    const input=fixture.posts.at(-1),totalCents=input.voucherCode==='free'?0:input.baseId==='episode-1'?(input.books.length===2?1999:input.books.length===1?1998:1499):499*(1+input.books.length);
    return route.fulfill({json:{sessionId:'cs_test_fixture_session'+fixture.posts.length,clientSecret:'fixture-client-secret',totalCents}});
   }
   if(url.pathname==='/api/checkout/status'){fixture.reads++;return route.fulfill({json:{paid:fixture.paid,delivered:fixture.delivered,noPaymentRequired:fixture.posts.at(-1)?.voucherCode==='free'}});}
   let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!path.extname(file))file+='.html';
   const target=path.join(process.cwd(),'dist/funnel',file);
   if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:''});
   const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
   return route.fulfill({contentType:type,body:fs.readFileSync(target)});
  });
  await page.goto(origin+'/checkout'+(returned?'?session_id=cs_test_fixture_returned':baseId==='episode-1'?'':'?product='+baseId));
  if(!returned&&scenario!=='disabled')await page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);
  else if(scenario==='disabled')await page.waitForFunction(()=>document.querySelector('#payment-note').textContent.includes('Platby ešte pripravujeme'));
  return {page,fixture,close:()=>context.close()};
 }
 try{
  for(const width of [360,390,430,1360]){
   const t=await open('normal',false,false,width),{page,fixture}=t;
   const activate=locator=>width<600?locator.tap():locator.click();
   assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
   assert.equal(await page.locator('#base-heading').innerText(),'Hra Pixelkovia – Stratený signál');
   assert.equal(await page.locator('.base-product li').first().innerText(),'7 záhad v jednom spoločnom príbehu');
   assert.equal(await page.locator('[data-summary-base-price]').innerText(),'29,99 €');
   assert.equal(await page.locator('#summary-early-discount strong').innerText(),'−15,00 €');
   assert.equal(await page.locator('.delivery-row').count(),0);
   assert.equal(await page.locator('[name="book-bundle"]').count(),1);
   assert.equal(await page.locator('[name="book"]').count(),0,'the game has one opt-in for both books');
   assert.equal(await page.locator('.bundle-book .offer-book-cover').count(),2,'both illustrated covers remain');
   await page.locator('[data-book-preview="story-book-before"]').click();
   await page.locator('[data-close-book-preview]').click();
   assert.equal(await page.locator('#select-bundle').isChecked(),false,'a sample does not opt in to the books');
   await activate(page.locator('#select-bundle'));assert.equal(await page.locator('#order-total').innerText(),'19,99 €');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'order fits '+width+' px');
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');
   await activate(page.locator('.checkout-buy'));await page.getByRole('button',{name:'Fixture pay',exact:true}).waitFor();
   assert.equal(await page.locator('#payment-order-total').innerText(),'19,99 €');
   assert.equal(await page.locator('#checkout-form').isHidden(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'payment fits '+width+' px');
   assert.equal(fixture.posts.length,1);
   await activate(page.locator('#change-order'));
   assert.equal(await page.locator('#checkout-form').isVisible(),true);
   assert.equal(await page.locator('[name="email"]').inputValue(),'checkout-fixture@example.invalid');
   assert.equal(await page.locator('#select-bundle').isChecked(),true);
   assert.deepEqual(fixture.posts[0].books,['story-book-before','story-book-after']);
   assert.equal(await page.locator('#order-total').innerText(),'19,99 €');
   assert.equal(fixture.posts.length,1,'editing does not create another session');
   await page.locator('#select-bundle').uncheck();assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
   if(width===390||width===1360){await page.locator('[name="email"]').fill('');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'/tmp/pixelkovia-checkout-offer-'+engine.name()+'-'+width+'.png',fullPage:true});}
   await require('./helpers/checkout-voucher.cjs')(page,{screenshotPrefix:width===390?'/tmp/pixelkovia-voucher-'+engine.name():undefined});
   await t.close();cases.push(width+' px: reference price, discounts, book bundle, voucher popup and preserved order on return');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('.checkout-buy').click();assert.equal(fixture.posts.length,0,'email is required before a session exists');
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('#select-bundle').click();
   await page.locator('.checkout-buy').click();await page.getByRole('button',{name:'Fixture pay',exact:true}).waitFor();
   assert.equal(await page.locator('#checkout-form').isHidden(),true,'payment is a compact step without the product picker');
   assert.equal(await page.locator('#payment-order-total').innerText(),'19,99 €');
   const methods=await page.evaluate(()=>checkoutFixture.formOptions.expressCheckout.paymentMethods);
   assert.equal(methods.link,'never');assert.notEqual(methods.applePay,'never');assert.notEqual(methods.googlePay,'never');
   await page.getByRole('button',{name:'Fixture pay',exact:true}).click();
   assert.equal(await page.locator('#change-order').isDisabled(),true,'order changes are blocked while confirmation is in flight');
   await page.getByRole('button',{name:'Fixture pay',exact:true}).click();
   assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),1,'a second tap cannot confirm again');
   await page.evaluate(()=>checkoutFixture.finish({type:'error',error:{message:'Karta bola zamietnutá.'}}));
   await page.getByText('Karta bola zamietnutá.',{exact:true}).waitFor();assert.equal(await page.locator('#change-order').isEnabled(),true);
   await page.getByRole('button',{name:'Fixture pay',exact:true}).click();
   await page.evaluate(()=>checkoutFixture.finish({throw:true}));await page.getByText('Platbu sa nepodarilo dokončiť. Skúste to znova.',{exact:true}).waitFor();
   await page.locator('#change-order').click();assert.equal(await page.locator('[name="email"]').inputValue(),'checkout-fixture@example.invalid');
   assert.equal(await page.locator('[name="email"]').isEnabled(),true);assert.equal(await page.locator('#select-bundle').isChecked(),true,'editing preserves the selected bundle');
   assert.equal(await page.locator('#checkout-form').isVisible(),true);
   const before=await page.evaluate(()=>checkoutFixture.calls.length);await page.evaluate(()=>checkoutFixture.stale({fixture:true}));
   assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),before,'destroyed forms cannot confirm a stale event');
   assert.deepEqual(await page.evaluate(()=>checkoutFixture.calls[0]),{redirect:'if_required',formEvent:true});
   await t.close();cases.push('required email, duplicate taps, declined/network errors, editable retry and stale callback isolation');
  }
  {
   const t=await open('load-error');const {page}=t;
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('.checkout-buy').click();
   await page.getByText('Platobný formulár sa nepodarilo načítať. Skúste to znova.',{exact:true}).waitFor();
   assert.equal(await page.locator('.checkout-buy').isEnabled(),true);assert.equal(await page.locator('[name="email"]').isEnabled(),true);
   await t.close();cases.push('provider initialization failure keeps the order editable');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('.checkout-buy').click();
   await page.getByRole('button',{name:'Fixture pay',exact:true}).click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Overujem'));
   assert.ok(!(await page.locator('#payment-status').innerText()).includes('Platba je potvrdená'),'the SDK result alone never declares an order paid');
   fixture.paid=true;await page.getByText('✓ Platba je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   assert.equal(await page.locator('.checkout-buy').isDisabled(),true);assert.equal(await page.locator('#change-order').isHidden(),true);
   assert.equal(await page.evaluate(()=>checkoutFixture.destroyed),1);assert.ok(fixture.reads>=2);
   await t.close();cases.push('confirmation waits for the server and cannot start a second order');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('#select-bundle').check();
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   await page.locator('[name="email"]').fill('voucher-fixture@example.invalid');await page.locator('.checkout-buy').click();
   await page.getByRole('button',{name:'Fixture pay',exact:true}).waitFor();
   assert.equal(await page.locator('#payment-order-total').innerText(),'0,00 €');
   assert.equal(await page.locator('#payment-heading').innerText(),'Potvrdenie objednávky zdarma');
   assert.equal(fixture.posts[0].voucherCode,'free');assert.equal(fixture.posts[0].books.length,2);
   await page.getByRole('button',{name:'Fixture pay',exact:true}).click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Overujem'));
   assert.ok(!(await page.locator('#payment-status').innerText()).includes('je potvrdená'),'free voucher also waits for server fulfillment');
   fixture.paid=true;await page.getByText('✓ Objednávka s voucherom je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   await t.close();cases.push('free voucher reaches Stripe with zero total and waits for server-confirmed access');
  }
  for(const baseId of ['story-book-before','story-book-after']){
   const t=await open('normal',false,false,390,baseId),{page,fixture}=t;
   assert.equal(await page.locator('#order-total').innerText(),'4,99 €');
   assert.equal(await page.locator('#summary-early-discount').isHidden(),true);
   assert.equal(await page.locator('#select-bundle').count(),0);
   await page.locator('[name="book"]').check();assert.equal(await page.locator('#order-total').innerText(),'9,98 €');
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'0,00 €');
   await page.locator('[name="email"]').fill('book-fixture@example.invalid');await page.locator('.checkout-buy').click();
   await page.getByRole('button',{name:'Fixture pay',exact:true}).waitFor();
   assert.equal(fixture.posts[0].baseId,baseId);assert.equal(fixture.posts[0].voucherCode,'free');assert.equal(fixture.posts[0].books.length,1);
   await t.close();cases.push(baseId+': independent book selection, full price and free voucher');
  }
  {
   const t=await open('disabled'),{page,fixture}=t;
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'0,00 €');assert.equal(await page.locator('.checkout-buy').isDisabled(),true);
   assert.equal(fixture.posts.length,0);await t.close();cases.push('voucher never bypasses server payment readiness');
  }
  {
   const t=await open('normal',true,true);const {page,fixture}=t;
   await page.getByText('✓ Platba je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   assert.equal(fixture.posts.length,0,'the bank return does not create a new payment');
   assert.equal(await page.locator('.checkout-buy').isDisabled(),true);assert.equal(await page.locator('[name="email"]').isDisabled(),true);
   await t.close();cases.push('bank return restores the server-confirmed result without creating another session');
  }
  cases.forEach(c=>console.log('PASS '+engine.name()+': '+c));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
