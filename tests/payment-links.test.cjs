const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('site-config.js','utf8');
function fixture(mode='test'){
 const context={window:{},URL};vm.runInNewContext(source,context);
 const cfg=context.window.SITE_CONFIG;
 Object.assign(cfg.payments,{mode,accountId:'acct_fixture',chargesEnabled:true,merchantNotificationsConfirmed:true});
 for(const [i,q]of cfg.paymentVariants().entries())cfg.payments.links[cfg.paymentKey(q)]={url:`https://buy.stripe.com/${mode==='test'?'test_':''}fixture${i}`,accountId:'acct_fixture',livemode:mode==='live',currency:'eur',priceCents:q.totalCents,verified:true};
 return cfg;
}
const blank={window:{},URL};vm.runInNewContext(source,blank);
assert.equal(blank.window.SITE_CONFIG.paymentsReady(),false);
assert.equal(blank.window.SITE_CONFIG.checkoutLink(blank.window.SITE_CONFIG.quote()),null,'missing real provider configuration cannot activate checkout');
for(const mode of ['test','live']){
 const cfg=fixture(mode),variants=cfg.paymentVariants();
 assert.equal(variants.length,14);assert.equal(new Set(variants.map(cfg.paymentKey)).size,14);
 assert.equal(cfg.paymentsReady(),true);
 for(const q of variants){
  const link=cfg.checkoutLink(q);assert.ok(link.startsWith('https://buy.stripe.com/'));
  assert.equal(cfg.payments.links[cfg.paymentKey(q)].priceCents,q.totalCents);
 }
 const before='story-book-before',after='story-book-after';
 assert.equal(cfg.paymentKey(cfg.quote([after],before)),cfg.paymentKey(cfg.quote([before],after)),'same two standalone books use the same offer');
 assert.notEqual(cfg.checkoutLink(cfg.quote()),cfg.checkoutLink(cfg.quote([],'episode-1','',false)),'Atlas selection is preserved on the Stripe offer');
 assert.equal(cfg.checkoutLink({...cfg.quote(),totalCents:1}),null,'a wrong total never selects a payment link');
 for(const bad of ['http://buy.stripe.com/fixture000','https://buy.stripe.com.evil.example/fixture000','https://evil.example/buy.stripe.com','javascript:alert(1)','https://user:pass@buy.stripe.com/fixture000','https://buy.stripe.com:8443/fixture000','https://buy.stripe.com/fixture000?redirect=https://evil.example','https://buy.stripe.com/fixture000#fake'])assert.equal(cfg.validStripeLink(bad),false);
 const key=cfg.paymentKey(cfg.quote()),good={...cfg.payments.links[key]};
 for(const patch of [{priceCents:1},{currency:'usd'},{verified:false},{accountId:'acct_other'},{livemode:mode!=='live'},{url:mode==='live'?'https://buy.stripe.com/test_fixture000':'https://buy.stripe.com/fixture000'}]){
  Object.assign(cfg.payments.links[key],good,patch);assert.equal(cfg.paymentsReady(),false);assert.equal(cfg.checkoutLink(cfg.quote()),null);
 }
 cfg.payments.links[key]=good;
 delete cfg.payments.links[key];assert.equal(cfg.paymentsReady(),false);cfg.payments.links[key]=good;
 cfg.payments.links['retired-product']=good;assert.equal(cfg.paymentsReady(),false);delete cfg.payments.links['retired-product'];
 const free=cfg.quote(cfg.offer.bookIds,'episode-1','free');
 assert.equal(cfg.checkoutLink(free),null,'free price needs a separately verified Stripe promotion');
 Object.assign(cfg.payments,{promotionCode:'free',promotionVerified:true});
 assert.equal(new URL(cfg.checkoutLink(free)).searchParams.get('prefilled_promo_code'),'free');
 if(mode==='live'){
  cfg.payments.merchantNotificationsConfirmed=false;assert.equal(cfg.paymentsReady(),false,'live activation waits for the requested merchant notifications');
  cfg.payments.merchantNotificationsConfirmed=true;cfg.payments.chargesEnabled=false;assert.equal(cfg.paymentsReady(),false,'live activation waits for an account able to accept payments');
 }
}
console.log('PASS: all 14 price/Atlas combinations, complete and standalone offers, mode/account/currency/price checks, official Stripe URL validation, verified free promotion and live notification prerequisite. No provider request or real payment was made.');
