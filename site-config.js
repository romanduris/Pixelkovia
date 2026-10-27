/* Etapa 1: one catalog and one purchase integration point. No payment or entitlement simulation. */
(() => {
  'use strict';
  const money = cents => new Intl.NumberFormat('sk-SK', {style:'currency', currency:'EUR'}).format(cents / 100).replace(/\u00a0/g, ' ');
  const products = [
    {id:'episode-1', name:'Pixelkovia: Stratený signál', priceCents:1499, pricing:{referencePriceCents:null, plannedStandardPriceCents:2999, campaign:'early-bird'}, status:'coming-soon', description:'Celá prvá epizóda, 7 pracovných listov, rodičovský návod, diplom, checklist a nápovedy.'},
    {id:'bedtime-book', name:'Tajný svet Pixelkov – knižka a encyklopédia', priceCents:490, status:'coming-soon', character:'piko', description:'Ilustrovaná rozprávka na spoločné čítanie a encyklopédia siedmich kamarátov. K hlavnej hre zdarma.'},
    {id:'story-book-before', name:'Ako vznikli Pixelkovia', priceCents:499, status:'coming-soon', pricing:{status:'draft',campaign:null}, description:'Kniha prvá · tri samostatné rozprávky pred dobrodružstvom. Pracovná cena; predaj pripravujeme.'},
    {id:'story-book-after', name:'Po veľkom záblesku', priceCents:499, status:'coming-soon', pricing:{status:'draft',campaign:null}, description:'Kniha druhá · tri samostatné rozprávky po dobrodružstve. Pracovná cena; predaj pripravujeme.'},
    {id:'atlas-pixelkov', name:'Atlas Pixelkov', priceCents:299, status:'coming-soon', description:'Sedem Pixelkov, ich schopnosti a aktivity. Plánovaná samostatná cena; v uvádzacej ponuke k hre zdarma.'},
    // Historical products remain unchanged for existing order references.
    {id:'piko-mission', name:'Piko – bonusová misia', priceCents:290, status:'coming-soon', character:'piko', description:'Ďalšie dobrodružstvo s modrým sprievodcom. Doplnkový obsah pripravujeme.'},
    {id:'listok-mission', name:'Pingy – bonusová misia', priceCents:290, status:'coming-soon', character:'pingy', description:'Ďalšie dobrodružstvo s dátovým poslom. Doplnkový obsah pripravujeme.'},
    {id:'kvak-mission', name:'Miky – bonusová misia', priceCents:290, status:'coming-soon', character:'miky', description:'Ďalšie dobrodružstvo s malým mikrofónom. Doplnkový obsah pripravujeme.'},
    {id:'mission-bundle', name:'Balík 3 bonusových misií', priceCents:490, status:'coming-soon', description:'Tri doplnkové dobrodružstvá s Pikom, Pingym a Mikym.'},
    {id:'complete', name:'Kompletné dobrodružstvo Pixelkov', priceCents:1989, status:'coming-soon', description:'Základná hra, tri bonusové misie a knižka s encyklopédiou zdarma.'}
  ];
  const product = id => products.find(p => p.id === id);
  const states = {'not-purchased':'Nezakúpené', purchased:'Zakúpené', available:'Dostupné', 'coming-soon':'Pripravujeme'};
  // Future server adapter must supply verified entitlements and content URLs.
  // The static prototype never grants purchases locally.
  const productState = (id, verifiedEntitlements = {}) => {
    const p = product(id);
    if (!p || p.status === 'coming-soon') return 'coming-soon';
    return verifiedEntitlements[id]?.available ? 'available' : verifiedEntitlements[id]?.purchased ? 'purchased' : 'not-purchased';
  };
  const purchase = {action:'purchase', url:'checkout.html', label:`CHCEM SPOLOČNÉ DOBRODRUŽSTVO – ${money(product('episode-1').priceCents)}`, status:'coming-soon'};
  const offer = {refundDays:14, contactEmail:'roman.duris@gmail.com', bookIds:['story-book-before','story-book-after'], missionIds:[], atlasId:'atlas-pixelkov', completeBundleCents:1999, campaign:'early-bird', paymentsEnabled:false};
  // Public offers use only the two books. Historical mission IDs never affect a quote.
  // Standalone books remain independent; the complete offer applies only to the game.
  const quote = (selected = [], baseId = 'episode-1') => {
    if(!offer.bookIds.includes(baseId))baseId='episode-1';
    const books=offer.bookIds.filter(id=>id!==baseId&&selected.includes(id));
    const booksCents=books.reduce((sum,id)=>sum+product(id).priceCents,0);
    const subtotalCents=product(baseId).priceCents+booksCents;
    const bundleDiscountCents=baseId==='episode-1'&&books.length===2?subtotalCents-offer.completeBundleCents:0;
    return {missions:[], extrasCents:0, savingsCents:bundleDiscountCents, books, booksCents, baseId, bundleDiscountCents, subtotalCents, atlasCents:0, totalCents:subtotalCents-bundleDiscountCents};
  };
  // Production is deliberately fail-closed until real server purchase verification exists.
  const access = {mode:'test', canLaunch: preparationReady => access.mode === 'test' && preparationReady};
  const management = {url:'https://treasurequest-admin.livingstones-romanduris.workers.dev', localPreviewUrl:'http://127.0.0.1:8787'};
  const managementUrl = () => {
    const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    const value = management.url || (local ? management.localPreviewUrl : null);
    if (!value) return null;
    try {const url = new URL(value);return url.protocol === 'https:' || (local && url.origin === management.localPreviewUrl) ? url.href : null;} catch (_) {return null;}
  };
  window.SITE_CONFIG = {products, product, money, states, productState, purchase, offer, quote, access, management, managementUrl};
})();
