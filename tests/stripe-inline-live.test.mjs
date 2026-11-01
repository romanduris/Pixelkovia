// Opt-in real Stripe SDK/API check. Only creates/expires unpaid Sessions.
// All payment-data and confirmation network requests are blocked in the browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fresh} from '../admin/tests/support.mjs';
import {createCheckout,checkoutConfig,verifiedCheckoutStatus,releaseCheckout} from '../admin/src/commerce.mjs';
const require=createRequire(new URL('../admin/package.json',import.meta.url));
test('real inline Stripe preserves the original page and validates fields without charging', {skip:process.env.STRIPE_INLINE_SMOKE!=='1',timeout:180000},async()=>{
 const Stripe=require('stripe'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 assert.ok(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_PUBLISHABLE_KEY);
 const client=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:'2026-08-26.dahlia',maxNetworkRetries:1});
 const db=fresh(),created=[];let browser;
 const env={TQ_DB:db,STRIPE_CLIENT:client,STRIPE_SECRET_KEY:process.env.STRIPE_SECRET_KEY,STRIPE_PUBLISHABLE_KEY:process.env.STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET:'unused',CUSTOMER_AUTH_SECRET:'a'.repeat(64),RESEND_API_KEY:'unused',MAIL_DOMAIN_VERIFIED:'true',PAYMENTS_ENABLED:'true'};
 try{
  for(const [voucher,total]of [['',1499],['1e',100],['free',0]]){
   const a=await createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:true,email:'inline-qa@example.invalid',uiMode:'elements',attemptKey:crypto.randomUUID(),voucherCode:voucher});created.push(a.sessionId);
   const s=await client.checkout.sessions.retrieve(a.sessionId);
   assert.equal(s.ui_mode,'elements');assert.equal(s.amount_total,total);assert.equal(s.currency,'eur');assert.equal(s.payment_intent,null);assert.ok(a.clientSecret);assert.equal(a.checkoutUrl,undefined);
   assert.equal(s.return_url,'https://pixelkovia.rodulab.com/checkout?session_id={CHECKOUT_SESSION_ID}');
   await client.checkout.sessions.expire(s.id);assert.equal((await verifiedCheckoutStatus(env,s.id)).state,'expired');
  }
  const deviceInput={baseId:'episode-1',books:[],atlasIncluded:true,email:'inline-device-qa@example.invalid',uiMode:'elements',voucherCode:'1e'};
  const desktop=await createCheckout(env,{...deviceInput,attemptKey:crypto.randomUUID()});created.push(desktop.sessionId);
  const phoneInput={...deviceInput,attemptKey:crypto.randomUUID()},phone=await createCheckout(env,phoneInput);created.push(phone.sessionId);
  const replaced=await client.checkout.sessions.retrieve(desktop.sessionId),current=await client.checkout.sessions.retrieve(phone.sessionId);
  assert.equal(replaced.status,'expired','actual Stripe closes the abandoned desktop Session before the phone can pay');
  assert.equal(replaced.payment_intent,null);assert.equal(current.status,'open');assert.equal(current.payment_intent,null);assert.notEqual(phone.sessionId,desktop.sessionId);
  await releaseCheckout(env,{attemptKey:phoneInput.attemptKey,retryPayment:true});
  assert.equal((await client.checkout.sessions.retrieve(phone.sessionId)).status,'expired','interrupted recovery verifies actual Stripe expiration before replacing the form');
  await releaseCheckout(env,{attemptKey:phoneInput.attemptKey,retryPayment:true}); // Lost-response replay rechecks the inactive key.
  const recovered=await createCheckout(env,{...deviceInput,attemptKey:crypto.randomUUID()});created.push(recovered.sessionId);
  assert.notEqual(recovered.sessionId,phone.sessionId);assert.equal((await client.checkout.sessions.retrieve(recovered.sessionId)).payment_intent,null);
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  let blocked=0,active;const diagnostics=[];
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='pixelkovia.rodulab.com'){
    if(url.pathname==='/api/checkout/config')return route.fulfill({json:checkoutConfig(env)});
    if(url.pathname==='/api/checkout/diagnostic'){diagnostics.push(route.request().postDataJSON());return route.fulfill({json:{received:true}});}
    if(url.pathname==='/api/checkout/session'){
     active=await createCheckout(env,route.request().postDataJSON());created.push(active.sessionId);return route.fulfill({json:active});
    }
    if(url.pathname==='/api/checkout/status')return route.fulfill({json:await verifiedCheckoutStatus(env,url.searchParams.get('session_id'))});
    let file=url.pathname==='/checkout'?'checkout.html':url.pathname.slice(1);const target=path.resolve('dist/funnel',file);
    if(!fs.existsSync(target))return route.fulfill({status:404,body:''});
    let body=fs.readFileSync(target);
    if(file==='checkout.js')body=Buffer.from(body.toString().replace('const loaded=await checkout.loadActions();','const loaded=await checkout.loadActions();window.__realCheckoutActions=loaded.actions;'));
    return route.fulfill({contentType:{'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(file)]||'application/octet-stream',body});
   }
   if(route.request().method()==='POST'&&url.hostname.endsWith('stripe.com')&&/\/(?:confirm|payment_methods|payment_intents|tokens)(?:\/|$)/.test(url.pathname)){blocked++;return route.abort('blockedbyclient');}
   return route.continue();
  });
  await page.goto('https://pixelkovia.rodulab.com/checkout',{waitUntil:'domcontentloaded'});
  await page.locator('[name=email]').fill('inline-qa-browser@example.invalid');await page.locator('.checkout-buy').click();
  await page.waitForFunction(()=>!document.querySelector('#stripe-pay').hidden&&!document.querySelector('#stripe-pay').disabled,{},{timeout:45000});
  assert.ok(page.url().startsWith('https://pixelkovia.rodulab.com/checkout'));assert.ok(await page.locator('.summary-inner #payment-slot iframe').isVisible());
  await page.locator('#payment-slot').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const geometry=await page.locator('#payment-slot iframe').boundingBox();assert.ok(geometry.width>280,'Stripe fields use the approved panel width');
  if(process.env.CHECKOUT_SCREENSHOT_DIR)await page.screenshot({path:process.env.CHECKOUT_SCREENSHOT_DIR+'/stripe-inline-original-390.png',fullPage:false});
  await page.locator('#stripe-pay').click();await page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
  assert.match(await page.locator('#payment-status').innerText(),/karty|údaje|neúplné/i);assert.ok(await page.locator('#stripe-pay').isEnabled());assert.ok(await page.locator('#payment-slot').isVisible());
  // Exercise the precise confirm parameters on blank real fields as well. No charge is possible.
  const blank=await page.evaluate(async()=>{try{const r=await window.__realCheckoutActions.confirm({redirect:'if_required'});return {type:r.type,code:r.error?.code,message:r.error?.message};}catch(e){return {thrown:e.name,message:e.message};}});
  assert.equal(blank.type,'error',blank.message);assert.equal(blank.thrown,undefined,'no duplicate-returnUrl IntegrationError');
  const card=page.frameLocator('#payment-slot iframe').first();
  const number=card.locator('input[name="number"]');
  const numberBox=await number.boundingBox();assert.ok(numberBox.width>200,'card number is readable across the panel');
  await number.fill('4242');await page.locator('#stripe-pay').click();assert.ok(await number.isEditable());
  await number.fill('4242424242424241'); // Invalid Luhn, never a chargeable PAN.
  const expiry=card.locator('input[name="expiry"]'),cvc=card.locator('input[name="cvc"]');
  await expiry.fill('0120');await cvc.fill('1');await page.locator('#stripe-pay').click();await page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);
  assert.ok(await number.isEditable());assert.ok(await page.locator('#payment-slot').isVisible());assert.equal(blocked,0);
  // Cover the branch that blank/invalid fields never reach: complete, public
  // Stripe test values, while every payment-data/confirmation request is blocked.
  // The former phone:'never' configuration threw IntegrationError at this point.
  assert.equal(await card.locator('input[name="phone"]').count(),0,'phone collection is not required for this digital purchase');
  await number.fill('4242424242424242');await expiry.fill('1230');await cvc.fill('123');
  await page.locator('#stripe-pay').click();
  await page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled&&document.querySelector('#payment-status').textContent.includes('Potvrdenie platby sa nedokončilo'));
  assert.ok(blocked>0,'complete valid fields reach the deliberately blocked payment boundary');
  assert.ok(await number.isEditable());assert.ok(await page.locator('#retry-payment').isVisible());
  assert.ok(!diagnostics.some(e=>['billing_phone_missing','billing_email_missing','sdk_integration_error'].includes(e.code)),'the real SDK accepts our billing collection contract');
  const unchanged=await client.checkout.sessions.retrieve(active.sessionId);assert.equal(unchanged.payment_intent,null);assert.equal(unchanged.payment_status,'unpaid');
  if(process.env.CHECKOUT_SCREENSHOT_DIR){await page.locator('#payment-slot').scrollIntoViewIfNeeded();await page.screenshot({path:process.env.CHECKOUT_SCREENSHOT_DIR+'/stripe-inline-validation-390.png',fullPage:false});}
 }finally{
  if(browser)await browser.close();
  for(const id of new Set(created)){const s=await client.checkout.sessions.retrieve(id);if(s.status==='open')await client.checkout.sessions.expire(id);}
  db.close();
 }
});
