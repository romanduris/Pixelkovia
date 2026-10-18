/* Etapa 1: one catalog and one purchase integration point. No payment or entitlement simulation. */
(() => {
  'use strict';
  const money = cents => new Intl.NumberFormat('sk-SK', {style:'currency', currency:'EUR'}).format(cents / 100).replace(/\u00a0/g, ' ');
  const products = [
    {id:'episode-1', name:'Pixelkovia: Stratený signál', priceCents:1499, pricing:{plannedRegularPriceCents:2999, referencePriceCents:null, campaign:null}, status:'coming-soon', description:'Celá prvá epizóda, tlačoviny, rodičovský návod, checklist a nápovedy.'},
    {id:'bedtime-book', name:'Tajný svet Pixelkov – rozprávková knižka', priceCents:499, status:'coming-soon', character:'piko', description:'Pracovný návrh: približne desať minút čítania pred spaním o svete Pixelkov, ich domovoch, vzniku a živote.'},
    {id:'piko-mission', name:'Piko – bonusová misia', priceCents:299, status:'coming-soon', character:'piko', description:'Pracovný návrh samostatnej približne 15-minútovej misie.'},
    {id:'listok-mission', name:'Lístok – bonusová misia', priceCents:299, status:'coming-soon', character:'listok', description:'Pracovný návrh samostatnej približne 15-minútovej misie.'},
    {id:'kvak-mission', name:'Kvak – bonusová misia', priceCents:299, status:'coming-soon', character:'kvak', description:'Pracovný návrh samostatnej približne 15-minútovej misie.'},
    {id:'complete', name:'Kompletné dobrodružstvo Pixelkov', priceCents:1999, status:'coming-soon', description:'Základná hra, rozprávková knižka a tri bonusové misie. Pracovná cena balíka nie je schválená na predaj.'}
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
  const purchase = {action:'purchase', label:`ZAŽIŤ DOBRODRUŽSTVO – ${money(product('episode-1').priceCents)}`, status:'coming-soon'};
  // Production is deliberately fail-closed until real server purchase verification exists.
  const access = {mode:'test', canLaunch: preparationReady => access.mode === 'test' && preparationReady};
  const management = {url:'https://treasurequest-admin.livingstones-romanduris.workers.dev', localPreviewUrl:'http://127.0.0.1:8787'};
  const managementUrl = () => {
    const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    const value = management.url || (local ? management.localPreviewUrl : null);
    if (!value) return null;
    try {const url = new URL(value);return url.protocol === 'https:' || (local && url.origin === management.localPreviewUrl) ? url.href : null;} catch (_) {return null;}
  };
  const purchaseHTML = () => `<div class="purchase-preview"><span class="section-kicker">PIXELKOVIA / VAŠA RODINNÁ VÝPRAVA</span><h2>Predaj pripravujeme</h2><p>Dobrodružstvo u vás doma bude dostupné za <strong>${money(product('episode-1').priceCents)}</strong>.</p><p>Predaj ešte nie je spustený. Na tejto stránke neprijímame platby ani nevytvárame objednávky.</p><div class="purchase-summary">✉ Papierové stopy doma<br>▷ Interaktívny príbeh na telefóne<br>♡ Spoločný čas s rodinou</div><button class="btn" data-action="close">Rozumiem, teším sa na dobrodružstvo</button></div>`;
  window.SITE_CONFIG = {products, product, money, states, productState, purchase, access, purchaseHTML, management, managementUrl};
})();
