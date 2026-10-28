const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine={chromium,webkit}[process.env.QA_BROWSER||'chromium'];
assert.ok(engine,'QA_BROWSER must be chromium or webkit');
const origin='https://pixelkovia.rodulab.com';
function installStripeStub(scenario){
 const state=window.checkoutFixture={calls:[],destroyed:0,walletDestroyed:0,finish:null,stale:null,totalCents:1499};
 window.Stripe=(key,options)=>{state.stripeOptions=options;return {initCheckoutElementsSdk(options){
  state.initOptions=options;
  return {
   on(){},
   async loadActions(){return scenario==='load-error'?{type:'error'}:{type:'success',actions:{
    getSession(){return {currency:'eur',minorUnitsAmountDivisor:100,total:{total:{minorUnitsAmount:state.totalCents+(scenario==='wrong-total'?1:0)}}};},
    confirm(options){
     state.calls.push({redirect:options.redirect,expressEvent:options.expressCheckoutConfirmEvent?.fixture===true});
     return new Promise((resolve,reject)=>{state.finish=result=>result.throw?reject(Error('Fixture network outage')):resolve(result);});
    }
   }};},
   createPaymentElement(options){
    state.cardOptions=options;
    const handlers={},card=document.createElement('div');card.textContent='Stripe card fields';card.style.height='240px';
    return {on(event,fn){handlers[event]=fn;},mount(selector){document.querySelector(selector).append(card);handlers[scenario==='card-load-error'?'loaderror':'ready']?.({});},destroy(){state.destroyed++;card.remove();}};
   },
   createExpressCheckoutElement(options){
    state.expressOptions=options;
    const handlers={},wallet=document.createElement('button');wallet.type='button';wallet.textContent='Fixture Apple Pay';
    wallet.addEventListener('click',()=>handlers.confirm({fixture:true,paymentFailed(){state.walletFailed=true;}}));
    return {on(event,fn){handlers[event]=fn;if(event==='confirm')state.stale=fn;},mount(selector){document.querySelector(selector).append(wallet);handlers.ready?.({availablePaymentMethods:scenario==='wallets'?{applePay:true,googlePay:true}:null});},destroy(){state.walletDestroyed++;wallet.remove();}};
   }
  };
 }}};
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
    const input=fixture.posts.at(-1),totalCents=input.voucherCode==='free'?0:input.voucherCode==='1e'?100:input.baseId==='episode-1'?((input.books.length===2?1998:input.books.length===1?1998:1499)+(input.giftGame?999:0)):499*(1+input.books.length);
    await page.evaluate(total=>checkoutFixture.totalCents=total,totalCents);
    return route.fulfill({json:{sessionId:'cs_test_fixture_session'+fixture.posts.length,clientSecret:'fixture-client-secret',totalCents}});
   }
   if(url.pathname==='/api/checkout/status'){fixture.reads++;return route.fulfill({json:{paid:fixture.paid,delivered:fixture.delivered,noPaymentRequired:fixture.posts.at(-1)?.voucherCode==='free',orderCount:fixture.posts.at(-1)?.giftGame?2:1}});}
   let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!path.extname(file))file+='.html';
   const target=path.join(process.cwd(),'dist/funnel',file);
   if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:''});
   const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
   return route.fulfill({contentType:type,body:fs.readFileSync(target)});
  });
  await page.goto(origin+'/checkout'+(returned?'?session_id=cs_test_fixture_returned':baseId==='episode-1'?'':'?product='+baseId));
  await page.evaluate(()=>document.fonts.ready);
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
   assert.equal(await page.locator('.base-product li').first().innerText(),'7 záhad · 45–60 minút spoločnej zábavy');
   assert.equal(await page.locator('[data-summary-base-price]').innerText(),'14,99 €');
   assert.equal(await page.locator('#summary-early-discount strong').textContent(),'−15,00 €');
   assert.equal(await page.locator('.launch-badge').innerText(),'Early Access');
   assert.equal(await page.locator('.summary-base>span').innerText(),'Rodinná hra Pixelkovia');
   assert.equal(await page.locator('.early-access-note').innerText(),'Prvá vlna Pixelkov je otvorená. Získajte kompletné dobrodružstvo za zvýhodnenú cenu.');
   assert.equal(await page.locator('#details-heading').innerText(),'Kam vám pošleme dobrodružstvo?');
   assert.equal(await page.locator('#email-note').innerText(),'Po zaplatení vám e-mailom príde prístup k hre a zakúpeným doplnkom.');
   assert.equal(await page.locator('#price-calculation').evaluate(el=>el.open),false,'calculation is collapsed before payment');
   assert.equal(await page.locator('#summary-saving').innerText(),'15,00 €');
   assert.ok(await page.locator('#summary-early-discount').isHidden());
   await page.locator('#summary-saving').click();
   assert.ok(await page.locator('#summary-early-discount').isVisible());
   await page.locator('#price-calculation summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#summary-early-discount').isHidden());
   assert.ok(await page.evaluate(()=>document.querySelector('.checkout-buy').getBoundingClientRect().top-document.querySelector('.summary-total').getBoundingClientRect().bottom<65),'collapsed savings keep the payable total close to the CTA');
   assert.ok(await page.locator('.checkout-help a').isHidden());
   await page.locator('.checkout-help summary').click();
   assert.ok(await page.locator('.checkout-help a').isVisible());
   assert.equal(await page.locator('.checkout-help a').innerText(),'miky@pixelkovia.rodulab.com');
   assert.equal(await page.locator('.checkout-help a').getAttribute('href'),'mailto:miky@pixelkovia.rodulab.com');
   await page.locator('.checkout-help summary').focus();await page.keyboard.press('Enter');
   assert.ok(await page.locator('.checkout-help a').isHidden());
   assert.equal(await page.locator('.summary-inner .checkout-help').count(),0,'contact disclosure sits below the payment information, outside the order card');
   assert.equal(await page.locator('.planned-price s').innerText(),'29,99 €');
   assert.equal(await page.locator('.book-bundle-option .addon-copy>label').innerText(),'Obe ilustrované knihy');
   assert.equal(await page.locator('.book-bundle-option .addon-copy>small').innerText(),'6 rozprávok · približne 40 minút čítania');
   assert.equal(await page.locator('.book-bundle-option .addon-price strong').innerText(),'+4,99 €');
   assert.ok((await page.locator('.book-pair .offer-book-cover').first().boundingBox()).height>=58,'covers are taller while the offer remains compact');
   assert.equal(await page.locator('.additional-game-addon .addon-price s').innerText(),'29,99 €');
   assert.equal(await page.locator('.additional-game-addon .addon-copy>label').innerText(),'Darujte dobrodružstvo');
   assert.equal(await page.locator('#gift-game-info').innerText(),'Poznáte rodinu, ktorej by sa Pixelkovia tiež páčili? Darujte im ich za špeciálnu cenu.');
   assert.ok(!/prednostn|plánovaná štandardná/i.test(await page.locator('body').innerText()));
   assert.equal(await page.locator('.delivery-row').count(),0);
   assert.equal(await page.locator('[name="name"]').count(),0,'only email is collected');
   assert.equal(await page.locator('#summary-heading').innerText(),'Vaša objednávka');
   assert.ok((await page.locator('.details-panel').boundingBox()).height<145,'email stays compact');
   assert.deepEqual(await page.locator('.checkout-content>section').evaluateAll(es=>es.map(e=>e.classList.contains('base-product')?'game':e.classList.contains('details-panel')?'email':'addons')),['game','email','addons']);
   assert.equal(await page.locator('#addon-gift-game').isChecked(),false);
   assert.match(await page.locator('.atlas-addon .addon-price').innerText(),/2,99 €[\s\S]*Teraz zdarma/);
   if(width<600){
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);assert.ok(height<1700,'compact phone checkout at '+width+' px: '+height+' px total');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.locator('#mobile-buy').tap();
    assert.equal(fixture.posts.length,0);assert.ok(await page.locator('[name="email"]').evaluate(el=>el===document.activeElement));
   }
   assert.equal(await page.locator('[name="book-bundle"]').count(),1);
   assert.equal(await page.locator('[name="book"]').count(),0,'the game has one opt-in for both books');
   assert.equal(await page.locator('.book-pair .offer-book-cover').count(),2,'both illustrated covers remain');
   await page.locator('[data-book-preview="collection"]').click();
   assert.equal(await page.locator('.book-preview-content').count(),2);assert.equal(await page.locator('.book-preview-pages img').count(),4);
   await page.locator('[data-close-book-preview]').click();
   assert.equal(await page.locator('#select-bundle').isChecked(),false,'a sample does not opt in to the books');
   await activate(page.locator('#select-bundle'));assert.equal(await page.locator('#order-total').innerText(),'19,98 €');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'order fits '+width+' px');
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');
   await activate(page.locator('#checkout-form .checkout-buy'));await page.locator('#stripe-pay').waitFor();
   assert.equal(await page.locator('#payment-order-total').innerText(),'19,98 €');
   assert.equal(await page.locator('#checkout-form').isVisible(),true,'order remains visible above the inline payment');
   assert.ok(await page.evaluate(()=>document.querySelector('#payment-panel').getBoundingClientRect().top>=document.querySelector('#checkout-form').getBoundingClientRect().bottom),'payment opens below the existing order');
   assert.equal(page.context().pages().length,1,'payment uses the current tab');
   assert.equal(new URL(page.url()).pathname,'/checkout');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'payment fits '+width+' px');
   assert.equal(fixture.posts.length,1);
   await page.waitForFunction(()=>{const r=document.querySelector('#payment-panel').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&scrollY>0;});
   if(width===390||width===1360)await page.screenshot({path:'/tmp/pixelkovia-inline-payment-'+engine.name()+'-'+width+'.png',fullPage:true});
   await activate(page.locator('#change-order'));
   assert.equal(await page.locator('#checkout-form').isVisible(),true);
   assert.equal(await page.locator('[name="email"]').inputValue(),'checkout-fixture@example.invalid');
   assert.equal(await page.locator('#select-bundle').isChecked(),true);
   assert.deepEqual(fixture.posts[0].books,['story-book-before','story-book-after']);
   assert.equal(await page.locator('#order-total').innerText(),'19,98 €');
   assert.equal(fixture.posts.length,1,'editing does not create another session');
   await page.locator('#select-bundle').uncheck();assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
   if(width===390||width===1360){await page.locator('[name="email"]').fill('');await page.evaluate(()=>{scrollTo({top:0,behavior:'instant'});document.querySelector('#mobile-checkout-bar').style.visibility='hidden';});await page.screenshot({path:'/tmp/pixelkovia-checkout-offer-'+engine.name()+'-'+width+'.png',fullPage:true});await page.locator('#mobile-checkout-bar').evaluate(el=>el.style.visibility='');}
   await require('./helpers/checkout-voucher.cjs')(page,{screenshotPrefix:width===390?'/tmp/pixelkovia-voucher-'+engine.name():undefined});
   await t.close();cases.push(width+' px: reference price, discounts, book bundle, voucher popup and preserved order on return');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('#checkout-form .checkout-buy').click();assert.equal(fixture.posts.length,0,'email is required before a session exists');
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('#select-bundle').click();
   await page.locator('#checkout-form .checkout-buy').click();await page.locator('#stripe-pay').waitFor();
   assert.equal(await page.locator('#checkout-form').isVisible(),true,'payment expands below the product picker and summary');
   assert.ok(await page.locator('#select-bundle').isDisabled(),'the visible order is locked to the active Stripe amount');
   assert.equal(await page.locator('#payment-order-total').innerText(),'19,98 €');
   const methods=await page.evaluate(()=>checkoutFixture.expressOptions.paymentMethods);
   assert.equal(methods.link,'never');assert.notEqual(methods.applePay,'never');assert.notEqual(methods.googlePay,'never');
   assert.equal(await page.evaluate(()=>checkoutFixture.stripeOptions.locale),'sk');
   assert.equal(await page.evaluate(()=>checkoutFixture.initOptions.defaultValues.billingAddress.address.country),'SK');
   assert.equal(await page.evaluate(()=>checkoutFixture.cardOptions.fields.billingDetails.email),'never','email is already collected before payment');
   assert.equal(fixture.posts[0].uiMode,'elements');
   assert.equal(await page.locator('#express-checkout-slot').isHidden(),true,'no empty wallet area on unsupported devices');
   assert.equal(await page.locator('.payment-order-summary details').evaluate(el=>el.open),false,'product detail is collapsed');
   await page.locator('#stripe-pay').click();
   assert.equal(await page.locator('#change-order').isDisabled(),true,'order changes are blocked while confirmation is in flight');
   await page.locator('#stripe-pay').dispatchEvent('click');
   assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),1,'a second tap cannot confirm again');
   await page.evaluate(()=>checkoutFixture.finish({type:'error',error:{message:'Karta bola zamietnutá.'}}));
   await page.getByText('Karta bola zamietnutá.',{exact:true}).waitFor();assert.equal(await page.locator('#change-order').isEnabled(),true);
   await page.locator('#stripe-pay').click();
   await page.evaluate(()=>checkoutFixture.finish({throw:true}));await page.getByText('Platbu sa nepodarilo dokončiť. Skúste to znova.',{exact:true}).waitFor();
   await page.locator('#change-order').click();assert.equal(await page.locator('[name="email"]').inputValue(),'checkout-fixture@example.invalid');
   assert.equal(await page.locator('[name="email"]').isEnabled(),true);assert.equal(await page.locator('#select-bundle').isChecked(),true,'editing preserves the selected bundle');
   assert.equal(await page.locator('#checkout-form').isVisible(),true);
   const before=await page.evaluate(()=>checkoutFixture.calls.length);await page.evaluate(()=>checkoutFixture.stale({fixture:true}));
   assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),before,'destroyed forms cannot confirm a stale event');
   assert.deepEqual(await page.evaluate(()=>checkoutFixture.calls[0]),{redirect:'if_required',expressEvent:false});
   await t.close();cases.push('required email, duplicate taps, declined/network errors, editable retry and stale callback isolation');
  }
  {
   const t=await open('load-error');const {page}=t;
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.getByText('Platobný formulár sa nepodarilo načítať. Skúste to znova.',{exact:true}).waitFor();
   assert.equal(await page.locator('#checkout-form .checkout-buy').isEnabled(),true);assert.equal(await page.locator('[name="email"]').isEnabled(),true);
   await t.close();cases.push('provider initialization failure keeps the order editable');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('[name="email"]').fill('checkout-fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.locator('#stripe-pay').click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Overujem'));
   assert.ok(!(await page.locator('#payment-status').innerText()).includes('Platba je potvrdená'),'the SDK result alone never declares an order paid');
   fixture.paid=true;await page.getByText('✓ Platba je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   assert.equal(await page.locator('#checkout-form .checkout-buy').isDisabled(),true);assert.equal(await page.locator('#change-order').isHidden(),true);
   assert.ok(await page.locator('#checkout-form').isVisible(),'server confirmation keeps the current order visible');
   assert.equal(await page.evaluate(()=>checkoutFixture.destroyed),1);assert.ok(fixture.reads>=2);
   await t.close();cases.push('confirmation waits for the server and cannot start a second order');
  }
  {
   const t=await open();const {page,fixture}=t;
   await page.locator('#select-bundle').check();
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   await page.locator('[name="email"]').fill('voucher-fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.locator('#stripe-pay').waitFor();
   assert.equal(await page.locator('#payment-order-total').innerText(),'0,00 €');
   assert.equal(await page.locator('#payment-heading').innerText(),'Potvrdenie objednávky zdarma');
   assert.equal(fixture.posts[0].voucherCode,'free');assert.equal(fixture.posts[0].books.length,2);
   await page.locator('#stripe-pay').click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Overujem'));
   assert.ok(!(await page.locator('#payment-status').innerText()).includes('je potvrdená'),'free voucher also waits for server fulfillment');
   fixture.paid=true;await page.getByText('✓ Objednávka s voucherom je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   await t.close();cases.push('free voucher reaches Stripe with zero total and waits for server-confirmed access');
  }
  for(const baseId of ['episode-1','story-book-before','story-book-after']){
   const t=await open('normal',false,false,390,baseId),{page,fixture}=t;
   if(baseId==='episode-1'){await page.locator('#select-bundle').check();await page.locator('#addon-gift-game').check();}
   else await page.locator('[name="book"]').check();
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill(' 1E ');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'1,00 €');
   assert.match(await page.locator('#summary-voucher').innerText(),/nákup za 1 €/);
   await page.locator('[name="email"]').fill('one-euro-fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.locator('#stripe-pay').waitFor();
   assert.equal(fixture.posts[0].voucherCode,'1e');assert.equal(await page.locator('#payment-order-total').innerText(),'1,00 €');
   assert.equal(await page.locator('#payment-heading').innerText(),'Bezpečná platba');
   await page.locator('#stripe-pay').click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Overujem'));
   assert.ok(!(await page.locator('#payment-status').innerText()).includes('Platba je potvrdená'));
   fixture.paid=true;await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
   await t.close();cases.push(baseId+': one-euro voucher keeps a paid one-euro total and waits for server confirmation');
  }
  for(const baseId of ['story-book-before','story-book-after']){
   const t=await open('normal',false,false,390,baseId),{page,fixture}=t;
   assert.equal(await page.locator('#order-total').innerText(),'4,99 €');
   assert.equal(await page.locator('#summary-early-discount').isHidden(),true);
   assert.equal(await page.locator('#select-bundle').count(),0);
   await page.locator('[name="book"]').check();assert.equal(await page.locator('#order-total').innerText(),'9,98 €');
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'0,00 €');
   await page.locator('[name="email"]').fill('book-fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.locator('#stripe-pay').waitFor();
   assert.equal(fixture.posts[0].baseId,baseId);assert.equal(fixture.posts[0].voucherCode,'free');assert.equal(fixture.posts[0].books.length,1);
   await t.close();cases.push(baseId+': independent book selection, full price and free voucher');
  }
  {
   const t=await open(),{page,fixture}=t;
   const summarySum=async()=>page.locator('.summary-inner').evaluate(root=>[...root.querySelectorAll('.summary-items .summary-row>strong,#summary-voucher>strong')].filter(el=>el.getClientRects().length&&el.textContent.trim().endsWith('€')).reduce((sum,el)=>sum+Math.round(Number(el.textContent.replace(/[\s€]/g,'').replace('−','-').replace(',','.'))*100),0));
   await page.locator('#addon-gift-game').check();assert.equal(await page.locator('#order-total').innerText(),'24,98 €');
   assert.equal(await page.locator('#summary-additional-game strong').innerText(),'9,99 €');
   assert.equal(await page.locator('#summary-gift-discount strong').textContent(),'−20,00 €');
   assert.equal(await summarySum(),2498,'the final prices of the selected items match the payable amount');
   await page.locator('#select-bundle').check();assert.equal(await page.locator('#order-total').innerText(),'29,97 €');
   assert.equal(await summarySum(),2997,'books are discounted by exactly half and the second game only once');
   assert.equal(await page.locator('#summary-books strong').innerText(),'4,99 €');
   assert.equal(await page.locator('#summary-saving').innerText(),'39,99 €');
   assert.ok((await page.locator('#email-note').innerText()).includes('samostatný prístup na darovanie'));
   assert.ok(await page.locator('#summary-gift-discount').isHidden());
   await page.locator('#price-calculation summary').click();
   for(const discount of ['#summary-early-discount','#summary-gift-discount','#summary-discount'])assert.ok(await page.locator(discount).isVisible(),'all three selected discounts are available in the calculation');
   const discountSum=()=>page.locator('.calculation-content .summary-discount>strong').evaluateAll(es=>es.filter(el=>el.getClientRects().length).reduce((sum,el)=>sum+Math.round(Number(el.textContent.replace(/[\s€−]/g,'').replace(',','.'))*100),0));
   assert.equal(await discountSum(),3999,'the three disclosed discounts add up to the displayed saving');
   await page.locator('#addon-gift-game').uncheck();assert.equal(await page.locator('#order-total').innerText(),'19,98 €');
   assert.ok(await page.locator('#summary-gift-discount').isHidden());
   await page.locator('#addon-gift-game').check();
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'0,00 €');
   assert.equal(await summarySum(),0,'the voucher also reconciles with all displayed discounts');
   assert.equal(await discountSum(),3999,'the voucher preserves the three separate offer discounts');
   await page.locator('#price-calculation summary').click();
   await page.locator('#voucher-open').click();await page.locator('#voucher-remove').click();assert.equal(await page.locator('#order-total').innerText(),'29,97 €');
   await page.locator('[name="email"]').fill('two-families@example.invalid');
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.locator('#mobile-buy').tap();
   await page.locator('#stripe-pay').waitFor();
   assert.equal(fixture.posts[0].giftGame,true);assert.equal(fixture.posts[0].name,undefined);
   assert.equal(await page.locator('#payment-order-total').innerText(),'29,97 €');
   assert.ok((await page.locator('#payment-order-items').textContent()).includes('Druhá hra pre ďalšiu rodinu'));
   assert.equal(await page.locator('#mobile-checkout-bar').isHidden(),true);
   await page.locator('#stripe-pay').click();await page.evaluate(()=>checkoutFixture.finish({type:'success'}));
   fixture.paid=true;await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('dva samostatné e-maily'));
   await t.close();cases.push('additional game, voucher, mobile CTA and two independent access emails');
  }
  {
   const t=await open('disabled'),{page,fixture}=t;
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('1e');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'1,00 €');assert.equal(await page.locator('#checkout-form .checkout-buy').isDisabled(),true);
   await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
   assert.equal(await page.locator('#order-total').innerText(),'0,00 €');assert.equal(await page.locator('#checkout-form .checkout-buy').isDisabled(),true);
   assert.equal(fixture.posts.length,0);await t.close();cases.push('voucher never bypasses server payment readiness');
  }
  {
   const t=await open('normal',true,true);const {page,fixture}=t;
   await page.getByText('✓ Platba je potvrdená. Prístupový e-mail pre vás pripravujeme.',{exact:true}).waitFor();
   assert.equal(fixture.posts.length,0,'the bank return does not create a new payment');
   assert.ok(await page.locator('#checkout-form').isHidden(),'a fresh bank-return page does not display an unrelated default cart');
   assert.equal(await page.locator('#checkout-form .checkout-buy').isDisabled(),true);assert.equal(await page.locator('[name="email"]').isDisabled(),true);
   await t.close();cases.push('bank return restores the server-confirmed result without creating another session');
  }
  {
   const t=await open('wallets'),{page}=t;
   await page.locator('[name="email"]').fill('wallet@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   await page.getByRole('button',{name:'Fixture Apple Pay'}).click();
   assert.equal(await page.locator('#stripe-pay').isDisabled(),true);
   await page.locator('#stripe-pay').dispatchEvent('click');assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),1,'wallet and card cannot confirm twice');
   await page.evaluate(()=>checkoutFixture.finish({type:'error',error:{message:'Platbu skúste znova.'}}));
   await page.waitForFunction(()=>checkoutFixture.walletFailed===true);
   assert.deepEqual(await page.evaluate(()=>checkoutFixture.calls[0]),{redirect:'if_required',expressEvent:true});
   await page.locator('#change-order').click();assert.equal(await page.evaluate(()=>checkoutFixture.walletDestroyed),1);
   await t.close();cases.push('eligible wallet confirms once, reports errors and is destroyed on editing');
  }
  for(const scenario of ['wrong-total','card-load-error']){
   const t=await open(scenario),{page}=t;
   await page.locator('[name="email"]').fill('failure@example.invalid');await page.locator('#checkout-form .checkout-buy').click();
   if(scenario==='wrong-total'){
    await page.getByText('Cena platby sa zmenila. Vráťte sa k objednávke a skúste to znova.',{exact:true}).waitFor();
    assert.ok(await page.locator('#checkout-form').isVisible());
   }else{
    await page.getByText('Údaje karty sa nepodarilo načítať. Upravte objednávku a skúste to znova.',{exact:true}).waitFor();
    assert.ok(await page.locator('#stripe-pay').isDisabled());await page.locator('#change-order').click();
   }
   assert.equal(await page.evaluate(()=>checkoutFixture.calls.length),0,'no confirmation with changed total or unavailable card fields');
   await t.close();cases.push(scenario+': payment cannot proceed and order can be corrected');
  }
  cases.forEach(c=>console.log('PASS '+engine.name()+': '+c));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
