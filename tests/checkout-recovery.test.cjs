const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const engine={chromium,webkit}[process.env.QA_BROWSER||'chromium'],origin='https://pixelkovia.rodulab.com';
function install(method){
 const s=window.walletFixture={calls:0,failed:0,destroyed:0,returned:false,nativeComplete:false,wallets:0};
 window.Stripe=()=>({initCheckoutElementsSdk(){return {
  on(){},
  async loadActions(){return {type:'success',actions:{getSession(){return {currency:'eur',minorUnitsAmountDivisor:100,total:{total:{minorUnitsAmount:1499}}};},confirm(options){s.calls++;s.forwarded=options.expressCheckoutConfirmEvent?.expressPaymentType;s.returnUrl=options.returnUrl;return new Promise((resolve,reject)=>{s.finish=value=>value.throw?reject(Error('Network lost after confirmation')):resolve(value);});}}};},
  createPaymentElement(){return {on(event,fn){if(event==='ready')s.cardReady=fn;},mount(selector){document.querySelector(selector).textContent='Card fields';s.cardReady?.();},destroy(){}};},
  createExpressCheckoutElement(options){
   s.wallets++;s.options=options;const handlers={};
   const button=document.createElement('button');button.type='button';button.textContent='Fixture '+method;
   s.event={expressPaymentType:method,paymentFailed(){s.failed++;}};
   button.addEventListener('click',async()=>{s.returned=false;await handlers.confirm(s.event);s.returned=true;queueMicrotask(()=>s.nativeComplete=s.destroyed===0);});
   s.cancel=()=>handlers.cancel?.({});s.again=()=>handlers.confirm(s.event);
   return {on(event,fn){handlers[event]=fn;},mount(selector){document.querySelector(selector).append(button);handlers.ready?.({availablePaymentMethods:{applePay:method==='apple_pay',googlePay:method==='google_pay'}});},destroy(){s.destroyed++;button.remove();}};
  }
 };}});
}
(async()=>{
 const browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
 const cases=[];cases.push=(value)=>{console.log('PASS '+engine.name()+': '+value);return Array.prototype.push.call(cases,value);};
 async function open(method='google_pay',wallets=true){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const f={posts:[],releases:0,reads:0,paid:false,state:'pending',delivered:false,hang:false,waiting:[],createLost:false,offline:false};
  await context.addInitScript(install,method);
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
   if(url.pathname==='/api/checkout/config')return route.fulfill({json:{enabled:true,publishableKey:'pk_test_fixture',wallets:{applePay:wallets,googlePay:wallets}}});
   if(url.pathname==='/api/checkout/session'){
    f.posts.push(route.request().postDataJSON());if(f.createLost){f.createLost=false;return route.abort();}
    return route.fulfill({json:{sessionId:'cs_test_recovery_browser_fixture',clientSecret:'fixture',totalCents:1499}});
   }
   if(url.pathname==='/api/checkout/release'){f.releases++;return route.fulfill({json:{released:true}});}
   if(url.pathname==='/api/checkout/status'){
    f.reads++;if(f.offline)return route.abort();if(f.hang)await new Promise(resolve=>f.waiting.push(resolve));
    try{return await route.fulfill({json:{state:f.paid?'paid':f.state,paid:f.paid,delivered:f.delivered,noPaymentRequired:false,orderCount:f.paid?1:0}});}catch{return;}
   }
   let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!path.extname(file))file+='.html';
   const target=path.join(process.cwd(),'dist/funnel',file);if(!fs.existsSync(target)||!fs.statSync(target).isFile())return route.fulfill({status:404,body:''});
   const contentType={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
   return route.fulfill({contentType,body:fs.readFileSync(target)});
  });
  const page=await context.newPage();await page.goto(origin+'/checkout');await page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);
  const start=async()=>{await page.locator('[name="email"]').fill('fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').tap();await page.locator('#stripe-pay').waitFor();};
  return {page,context,f,start,async close(){f.hang=false;f.waiting.splice(0).forEach(resolve=>resolve());await context.close();}};
 }
 try{
  for(const method of ['google_pay','apple_pay']){
   {
    const t=await open(method),{page,f}=t;await t.start();f.hang=true;
    await page.getByRole('button',{name:'Fixture '+method}).tap();await page.evaluate(()=>walletFixture.finish({type:'success'}));
    await page.waitForFunction(()=>walletFixture.returned&&walletFixture.nativeComplete,{},{timeout:2000});
    assert.equal(await page.evaluate(()=>walletFixture.destroyed),0,'native wallet element stays mounted');
    assert.equal(await page.evaluate(()=>walletFixture.failed),0);assert.equal(await page.evaluate(()=>walletFixture.forwarded),method);
    assert.match(await page.evaluate(()=>walletFixture.returnUrl),/session_id=cs_test_recovery_browser_fixture/);
    assert.match(await page.locator('#payment-status').textContent(),/neplaťte znova/);
    assert.ok(await page.locator('#change-order').isDisabled());
    f.paid=true;f.hang=false;f.waiting.splice(0).forEach(resolve=>resolve());
    await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
    assert.match(await page.locator('#payment-status').textContent(),/e-mail pre vás pripravujeme/);
    assert.equal(f.posts.length,1);assert.equal(await page.evaluate(()=>walletFixture.calls),1);
    await page.screenshot({path:'/tmp/pixelkovia-'+engine.name()+'-'+method+'-success.png',fullPage:true});
    await page.locator('#new-order').tap();await page.waitForFunction(()=>!document.querySelector('[name="email"]').disabled);
    assert.equal(f.releases,1);assert.equal(f.posts.length,1,'a next purchase needs a separate deliberate continuation');
    await page.locator('#checkout-form .checkout-buy').tap();await page.locator('#stripe-pay').waitFor();
    assert.equal(f.posts.length,2);assert.notEqual(f.posts[0].attemptKey,f.posts[1].attemptKey);assert.equal(f.posts[1].newPurchase,true);
    await t.close();cases.push(method+': callback returns before status/webhook/mail and retains native element');
   }
   {
    const t=await open(method),{page,f}=t;await t.start();await page.getByRole('button',{name:'Fixture '+method}).tap();
    f.paid=true;await page.evaluate(()=>walletFixture.finish({throw:true}));
    await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
    assert.equal(await page.evaluate(()=>walletFixture.failed),0,'transport errors never report wallet failure');
    assert.equal(f.posts.length,1);await t.close();cases.push(method+': charged payment with SDK network error recovers as paid');
   }
   {
    const t=await open(method),{page,f}=t;await t.start();await page.getByRole('button',{name:'Fixture '+method}).tap();
    f.offline=true;await page.evaluate(()=>walletFixture.finish({type:'error',error:{type:'api_error',message:'callback timeout'}}));await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('neplaťte znova'));
    assert.ok(await page.locator('#change-order').isDisabled());assert.ok(await page.locator('#new-order').isHidden());assert.ok(await page.locator('#retry-payment').isHidden());
    await page.locator('#stripe-pay').dispatchEvent('click');await page.evaluate(()=>walletFixture.again());
    assert.equal(await page.evaluate(()=>walletFixture.calls),1);assert.equal(await page.evaluate(()=>walletFixture.failed),0);
    await page.screenshot({path:'/tmp/pixelkovia-'+engine.name()+'-'+method+'-pending.png',fullPage:true});
    await page.reload();await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('neplaťte znova'));
    assert.equal(f.posts.length,1,'refresh recovers status without creating a Session');
    assert.equal(await page.evaluate(()=>walletFixture.calls),0,'refresh never reconfirms payment');
    const sibling=await t.context.newPage();await sibling.goto(origin+'/checkout');await sibling.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('neplaťte znova'));
    assert.equal(f.posts.length,1,'reopening checkout in another tab recovers the original Session');
    await page.goto(origin+'/');await page.goBack();await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('neplaťte znova'));assert.equal(f.posts.length,1);
    f.offline=false;f.paid=true;
    await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
    assert.ok(await page.locator('#stripe-pay').isHidden());assert.equal(f.releases,0);
    await t.close();cases.push(method+': unknown outcome survives refresh, back and another tab without another charge');
   }
   {
    const t=await open(method),{page,f}=t;await t.start();
    await page.evaluate(()=>walletFixture.cancel());assert.equal(await page.evaluate(()=>walletFixture.calls),0);
    await page.getByRole('button',{name:'Fixture '+method}).tap();
    await page.evaluate(()=>walletFixture.finish({type:'error',error:{type:'card_error',message:'Banka platbu zamietla.'}}));
    await page.waitForFunction(()=>walletFixture.failed===1);assert.ok(await page.locator('#stripe-pay').isEnabled());
    await page.getByRole('button',{name:'Fixture '+method}).tap();f.paid=true;await page.evaluate(()=>walletFixture.finish({type:'success'}));
    await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
    assert.equal(f.posts.length,1,'deliberate retry retains one Stripe Session');assert.equal(await page.evaluate(()=>walletFixture.calls),2);
    await t.close();cases.push(method+': native cancellation and confirmed decline allow deliberate same-Session retry');
   }
   {
    const t=await open(method),{page,f}=t;await t.start();await page.clock.install();
    await page.getByRole('button',{name:'Fixture '+method}).tap();await page.clock.fastForward(21000);
    assert.match(await page.locator('#payment-status').textContent(),/neplaťte znova/);
    assert.equal(await page.evaluate(()=>walletFixture.failed),0);assert.equal(await page.evaluate(()=>walletFixture.destroyed),0);
    assert.ok(await page.locator('#change-order').isDisabled());
    f.paid=true;await page.evaluate(()=>walletFixture.finish({type:'success'}));await page.clock.runFor(1600);
    await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('✓ Platba je potvrdená.'));
    assert.equal(f.posts.length,1);await t.close();cases.push(method+': hung SDK watchdog never fails/destroys wallet and late success recovers');
   }
  }
  {
   const t=await open('apple_pay',false),{page}=t;await t.start();assert.equal(await page.evaluate(()=>walletFixture.wallets),0);assert.ok(await page.locator('#stripe-pay').isEnabled());await t.close();cases.push('unvalidated live wallets stay off while card checkout works');
  }
  {
   const t=await open(),{page,f}=t;f.createLost=true;
   await page.locator('[name="email"]').fill('fixture@example.invalid');await page.locator('#checkout-form .checkout-buy').tap();
   await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('ten istý nákup'));
   await page.reload();await page.locator('#retry-payment').waitFor();
   await page.locator('#retry-payment').tap();await page.locator('#stripe-pay').waitFor();
   assert.equal(f.posts.length,2);assert.deepEqual(f.posts[0],f.posts[1],'lost-create recovery sends the exact original request/key');
   await page.reload();await page.locator('#retry-payment').waitFor();await page.locator('#retry-payment').tap();await page.locator('#stripe-pay').waitFor();
   assert.equal(f.posts.length,3);assert.deepEqual(f.posts[0],f.posts[2],'unsubmitted reload resumes the same session');
   await t.close();cases.push('lost session creation and unsubmitted refresh retain original idempotency key and selection');
  }

 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
