/* Current catalog. Payment readiness and ownership are checked by the server. */
(() => {
  'use strict';
  const money = cents => new Intl.NumberFormat('sk-SK', {style:'currency', currency:'EUR'}).format(cents / 100).replace(/\u00a0/g, ' ');
  const products = [
    {id:'episode-1', name:'Hra Pixelkovia – Stratený signál', priceCents:1499, pricing:{referencePriceCents:null, plannedStandardPriceCents:2999, campaign:'early-bird'}, status:'available', description:'7 záhad v jednom spoločnom príbehu, 7 pracovných listov, rodičovský návod, diplom, checklist a nápovedy.'},
    {id:'story-book-before', name:'Ako vznikli Pixelkovia', priceCents:499, status:'available', pricing:{status:'current',campaign:null}, description:'Kniha prvá · tri samostatné rozprávky pred dobrodružstvom. '},
    {id:'story-book-after', name:'Po veľkom záblesku', priceCents:499, status:'available', pricing:{status:'current',campaign:null}, description:'Kniha druhá · tri samostatné rozprávky po dobrodružstve. '},
    {id:'atlas-pixelkov', name:'Atlas Pixelkov', priceCents:299, status:'available', description:'Sedem Pixelkov, ich schopnosti a aktivity. Plánovaná samostatná cena; v uvádzacej ponuke k hre zdarma.'}
  ];
  const product = id => products.find(p => p.id === id);
  const payments = {provider:'stripe', endpoint:'/api/checkout/session'};
  const states = {'not-purchased':'Nezakúpené', purchased:'Zakúpené', available:'Dostupné', 'coming-soon':'Pripravujeme'};
  // Future server adapter must supply verified entitlements and content URLs.
  // The static prototype never grants purchases locally.
  const productState = (id, verifiedEntitlements = {}) => {
    const p = product(id);
    if (!p || p.status === 'coming-soon') return 'coming-soon';
    return verifiedEntitlements[id]?.available ? 'available' : verifiedEntitlements[id]?.purchased ? 'purchased' : 'not-purchased';
  };
  const purchase = {action:'purchase', url:'checkout.html', label:`CHCEM SPOLOČNÉ DOBRODRUŽSTVO – ${money(product('episode-1').priceCents)}`, status:'available'};
  const offer = {refundDays:14, contactEmail:'roman.duris@gmail.com', bookIds:['story-book-before','story-book-after'], atlasId:'atlas-pixelkov', completeBundleCents:1998, additionalGameCents:999, campaign:'early-bird'};
  // All prices are calculated in integer cents.
  // Standalone books remain independent; the complete offer applies only to the game.
  const quote = (selected = [], baseId = 'episode-1', includeAtlas = true, voucherCode = '', includeGift = false) => {
    if(!offer.bookIds.includes(baseId))baseId='episode-1';
    const books=offer.bookIds.filter(id=>id!==baseId&&selected.includes(id));
    const booksCents=books.reduce((sum,id)=>sum+product(id).priceCents,0);
    const primarySubtotalCents=product(baseId).priceCents+booksCents;
    const giftGame=baseId==='episode-1'&&includeGift===true;
    const giftCents=giftGame?offer.additionalGameCents:0;
    const subtotalCents=primarySubtotalCents+giftCents;
    const bundleDiscountCents=baseId==='episode-1'&&books.length===2?primarySubtotalCents-offer.completeBundleCents:0;
    const beforeVoucherCents=subtotalCents-bundleDiscountCents;
    const code=typeof voucherCode==='string'?voucherCode.trim().toLowerCase():'';
    const voucher=['free','1e'].includes(code)?code:null;
    const totalCents=voucher==='free'?0:voucher==='1e'?100:beforeVoucherCents;
    const voucherDiscountCents=beforeVoucherCents-totalCents;
    const giftTotalCents=voucher?Math.round(totalCents*giftCents/beforeVoucherCents):giftCents;
    return {books, booksCents, baseId, bundleDiscountCents, subtotalCents, atlasIncluded:Boolean(includeAtlas), atlasCents:0, giftGame, giftCents, giftTotalCents, primaryTotalCents:totalCents-giftTotalCents, voucher, voucherDiscountCents, totalCents};
  };
  const localPreview=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname);
  const access = {mode:(window.PIXELKOVIA_ADMIN||localPreview)?'test':'authenticated', canLaunch:ready=>Boolean(window.PIXELKOVIA_RUN)||Boolean(window.PIXELKOVIA_ADMIN&&ready)};
  const management = {url:'https://pixelkovia.rodulab.com/admin', localPreviewUrl:'http://127.0.0.1:8787'};
  const managementUrl = () => {
    const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    const value = management.url || (local ? management.localPreviewUrl : null);
    if (!value) return null;
    try {const url = new URL(value);return url.protocol === 'https:' || (local && url.origin === management.localPreviewUrl) ? url.href : null;} catch (_) {return null;}
  };
  window.SITE_CONFIG = {products, product, money, states, productState, purchase, offer, quote, payments, access, management, managementUrl};
})();
