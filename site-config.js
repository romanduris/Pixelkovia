/* Etapa 1: one catalog and one purchase integration point. No payment or entitlement simulation. */
(() => {
  'use strict';
  const money = cents => new Intl.NumberFormat('sk-SK', {style:'currency', currency:'EUR'}).format(cents / 100).replace(/\u00a0/g, ' ');
  const products = [
    {id:'episode-1', name:'Pixelkovia: Stratený signál', priceCents:1499, pricing:{referencePriceCents:null, plannedStandardPriceCents:2999, campaign:'early-bird'}, status:'coming-soon', description:'Celá prvá epizóda, 7 pracovných listov, rodičovský návod, diplom, checklist a nápovedy.'},
    {id:'story-book-before', name:'Ako vznikli Pixelkovia', priceCents:499, status:'coming-soon', pricing:{status:'draft',campaign:null}, description:'Kniha prvá · tri samostatné rozprávky pred dobrodružstvom. Pracovná cena; predaj pripravujeme.'},
    {id:'story-book-after', name:'Po veľkom záblesku', priceCents:499, status:'coming-soon', pricing:{status:'draft',campaign:null}, description:'Kniha druhá · tri samostatné rozprávky po dobrodružstve. Pracovná cena; predaj pripravujeme.'},
    {id:'atlas-pixelkov', name:'Atlas Pixelkov', priceCents:299, status:'coming-soon', description:'Sedem Pixelkov, ich schopnosti a aktivity. Plánovaná samostatná cena; v uvádzacej ponuke k hre zdarma.'}
  ];
  const product = id => products.find(p => p.id === id);
  // Public Stripe links only. Never put API keys or webhook secrets here.
  // Keep disabled until the connected Stripe account and every offer are verified.
  const payments = {mode:'disabled', accountId:null, chargesEnabled:false, merchantNotificationsConfirmed:false, notificationEmail:'roman.duris@gmail.com', promotionCode:null, promotionVerified:false, links:{}};
  const states = {'not-purchased':'Nezakúpené', purchased:'Zakúpené', available:'Dostupné', 'coming-soon':'Pripravujeme'};
  // Future server adapter must supply verified entitlements and content URLs.
  // The static prototype never grants purchases locally.
  const productState = (id, verifiedEntitlements = {}) => {
    const p = product(id);
    if (!p || p.status === 'coming-soon') return 'coming-soon';
    return verifiedEntitlements[id]?.available ? 'available' : verifiedEntitlements[id]?.purchased ? 'purchased' : 'not-purchased';
  };
  const purchase = {action:'purchase', url:'checkout.html', label:`CHCEM SPOLOČNÉ DOBRODRUŽSTVO – ${money(product('episode-1').priceCents)}`, status:'coming-soon'};
  const offer = {refundDays:14, contactEmail:'roman.duris@gmail.com', bookIds:['story-book-before','story-book-after'], atlasId:'atlas-pixelkov', completeBundleCents:1999, campaign:'early-bird', paymentsEnabled:false, developmentVoucher:'free'};
  // All prices are calculated in integer cents.
  // Standalone books remain independent; the complete offer applies only to the game.
  const quote = (selected = [], baseId = 'episode-1', voucherCode = '', includeAtlas = true) => {
    if(!offer.bookIds.includes(baseId))baseId='episode-1';
    const books=offer.bookIds.filter(id=>id!==baseId&&selected.includes(id));
    const booksCents=books.reduce((sum,id)=>sum+product(id).priceCents,0);
    const subtotalCents=product(baseId).priceCents+booksCents;
    const bundleDiscountCents=baseId==='episode-1'&&books.length===2?subtotalCents-offer.completeBundleCents:0;
    // Development price preview only. A future server must verify real vouchers.
    const voucher=String(voucherCode).trim().toLowerCase()===offer.developmentVoucher?offer.developmentVoucher:null;
    const voucherDiscountCents=voucher?subtotalCents-bundleDiscountCents:0;
    return {books, booksCents, baseId, bundleDiscountCents, subtotalCents, atlasIncluded:Boolean(includeAtlas), atlasCents:0, voucher, voucherDiscountCents, totalCents:subtotalCents-bundleDiscountCents-voucherDiscountCents};
  };
  const paymentKey = q => [q.baseId,...q.books,...(q.atlasIncluded?[offer.atlasId]:[])].sort().join('|');
  const paymentVariants = () => [quote(),quote([offer.bookIds[0]]),quote([offer.bookIds[1]]),quote(offer.bookIds),quote([],offer.bookIds[0]),quote([],offer.bookIds[1]),quote([offer.bookIds[1]],offer.bookIds[0])].flatMap(q=>[q,{...q,atlasIncluded:false}]);
  const validStripeLink = value => {
    if(typeof value!=='string')return false;
    try{
      const url=new URL(value);
      return url.protocol==='https:'&&url.hostname==='buy.stripe.com'&&!url.port&&!url.username&&!url.password&&!url.search&&!url.hash&&/^\/[a-zA-Z0-9_-]{6,}$/.test(url.pathname)&&(url.pathname.startsWith('/test_')===(payments.mode==='test'));
    }catch{return false;}
  };
  const paymentsReady = () => {
    if(!['test','live'].includes(payments.mode)||!/^acct_[a-zA-Z0-9]+$/.test(payments.accountId||''))return false;
    if(payments.mode==='live'&&(payments.chargesEnabled!==true||payments.merchantNotificationsConfirmed!==true))return false;
    const variants=paymentVariants();
    return Object.keys(payments.links).length===variants.length&&variants.every(q=>{
      const link=payments.links[paymentKey(q)];
      return link?.verified===true&&link.accountId===payments.accountId&&link.livemode===(payments.mode==='live')&&link.currency==='eur'&&link.priceCents===q.totalCents&&validStripeLink(link.url);
    });
  };
  const checkoutLink = q => {
    if(!paymentsReady())return null;
    const link=payments.links[paymentKey(q)];
    if(!link||link.priceCents!==q.totalCents+q.voucherDiscountCents)return null;
    const url=new URL(link.url);
    if(q.voucher){
      if(!payments.promotionVerified||payments.promotionCode!==q.voucher)return null;
      url.searchParams.set('prefilled_promo_code',q.voucher);
    }
    return url.href;
  };
  offer.paymentsEnabled=paymentsReady();
  if(offer.paymentsEnabled)offer.developmentVoucher=payments.promotionVerified?payments.promotionCode:null;
  // Production is deliberately fail-closed until real server purchase verification exists.
  const access = {mode:'test', canLaunch: preparationReady => access.mode === 'test' && preparationReady};
  const management = {url:'https://treasurequest-admin.livingstones-romanduris.workers.dev', localPreviewUrl:'http://127.0.0.1:8787'};
  const managementUrl = () => {
    const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    const value = management.url || (local ? management.localPreviewUrl : null);
    if (!value) return null;
    try {const url = new URL(value);return url.protocol === 'https:' || (local && url.origin === management.localPreviewUrl) ? url.href : null;} catch (_) {return null;}
  };
  window.SITE_CONFIG = {products, product, money, states, productState, purchase, offer, quote, payments, paymentKey, paymentVariants, validStripeLink, paymentsReady, checkoutLink, access, management, managementUrl};
})();
