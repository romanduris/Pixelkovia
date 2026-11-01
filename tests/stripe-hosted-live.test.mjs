// Opt-in provider smoke: creates and expires unconfirmed Stripe Sessions only.
// Payment-data/confirmation requests are blocked. Never sends a card or an email.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fresh} from '../admin/tests/support.mjs';
import {createCheckout,verifiedCheckoutStatus} from '../admin/src/commerce.mjs';
const require=createRequire(new URL('../admin/package.json',import.meta.url));
test('real Stripe accepts hosted pricing and validates card fields without submitting a payment', {skip:process.env.STRIPE_HOSTED_SMOKE!=='1',timeout:180000},async()=>{
 const Stripe=require('stripe'),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 assert.ok(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_PUBLISHABLE_KEY);
 const client=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:'2026-08-26.dahlia',maxNetworkRetries:1});
 const db=fresh(),created=[];let browser,page;
 const env={TQ_DB:db,STRIPE_CLIENT:client,STRIPE_SECRET_KEY:process.env.STRIPE_SECRET_KEY,STRIPE_PUBLISHABLE_KEY:process.env.STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET:'unused',CUSTOMER_AUTH_SECRET:'a'.repeat(64),RESEND_API_KEY:'unused',MAIL_DOMAIN_VERIFIED:'true',PAYMENTS_ENABLED:'true'};
 try{
  for(const [voucher,total]of [['',1499],['1e',100],['free',0]]){
   const a=await createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:true,email:'checkout-qa@example.invalid',uiMode:'hosted',attemptKey:crypto.randomUUID(),voucherCode:voucher});created.push(a.sessionId);
   const s=await client.checkout.sessions.retrieve(a.sessionId);
   assert.equal(s.ui_mode,'hosted_page');assert.equal(s.amount_total,total);assert.equal(s.currency,'eur');assert.equal(s.payment_intent,null);assert.equal(a.clientSecret,undefined);assert.ok(a.checkoutUrl);
   assert.equal((await verifiedCheckoutStatus(env,s.id)).checkoutUrl,a.checkoutUrl);
   await client.checkout.sessions.expire(s.id);assert.equal((await verifiedCheckoutStatus(env,s.id)).state,'expired');
  }
  const a=await createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:true,email:'checkout-qa-browser@example.invalid',uiMode:'hosted',attemptKey:crypto.randomUUID()});created.push(a.sessionId);
  const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
  browser=await engine.launch({headless:true,...(engine===webkit?{env:{...process.env,WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1',WEBKIT_DISABLE_COMPOSITING_MODE:'1',JSC_useJIT:'0'}}:{})});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page=await context.newPage();
  let blocked=0;
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(route.request().method()==='POST'&&url.hostname.endsWith('stripe.com')&&/\/(?:confirm|payment_methods|payment_intents|tokens)(?:\/|$)/.test(url.pathname)){blocked++;return route.abort('blockedbyclient');}
   return route.continue();
  });
  await page.goto(a.checkoutUrl,{waitUntil:'domcontentloaded',timeout:45000});
  const pay=page.locator('button[type=submit]').last();await pay.waitFor({timeout:45000});
  await pay.click();await page.waitForFunction(()=>document.querySelector('#cardNumber')?.getAttribute('aria-invalid')==='true');
  assert.ok(await page.locator('#cardNumber').isVisible());
  await page.locator('#cardNumber').fill('4242');await page.locator('#cardExpiry').focus();
  assert.ok(await pay.isEnabled(),'incomplete details stay editable');
  await page.locator('#cardNumber').fill('4242424242424241'); // Deliberately fails Luhn; never a chargeable PAN.
  await page.locator('#cardExpiry').fill('0120');await page.locator('#cardCvc').fill('1');await page.locator('#billingName').fill('QA');
  await pay.click();
  await page.waitForFunction(()=>document.querySelector('#cardNumber')?.getAttribute('aria-invalid')==='true');
  assert.equal(await page.locator('#cardExpiry').getAttribute('aria-invalid'),'true','expired date is marked invalid');assert.equal(await page.locator('#cardCvc').getAttribute('aria-invalid'),'true','incomplete CVC is marked invalid');assert.ok(await page.locator('#cardCvc').isEditable());
  await page.locator('#cardNumber').fill('');await pay.click();assert.ok(await page.locator('#cardNumber').isEditable());
  if(process.env.CHECKOUT_SCREENSHOT_DIR)await page.screenshot({path:process.env.CHECKOUT_SCREENSHOT_DIR+'/stripe-card-validation-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
  const s=await client.checkout.sessions.retrieve(a.sessionId);assert.equal(s.payment_intent,null);assert.equal(s.payment_status,'unpaid');assert.equal(blocked,0,'invalid fields are rejected locally before any payment-data request');
  const back=await page.locator('a').evaluateAll(nodes=>nodes.map(n=>n.href).find(h=>h.includes('/checkout?checkout_id=')));
  assert.ok(back,'Stripe offers the server-issued cancel URL');
  const cancel=new URL(back);assert.equal(cancel.origin,'https://pixelkovia.rodulab.com');
  const state=await verifiedCheckoutStatus(env,null,cancel.searchParams.get('checkout_id'));assert.equal(state.sessionId,a.sessionId);assert.equal(state.state,'ready');
 }catch(error){
  if(page&&process.env.CHECKOUT_SCREENSHOT_DIR){await page.screenshot({path:process.env.CHECKOUT_SCREENSHOT_DIR+'/stripe-smoke-failure-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});console.error('Hosted page visible text: '+(await page.locator('body').innerText()).slice(0,1200));}
  throw error;
 }finally{
  if(browser)await browser.close();
  for(const id of created){const s=await client.checkout.sessions.retrieve(id);if(s.status==='open')await client.checkout.sessions.expire(id);}
  db.close();
 }
});
