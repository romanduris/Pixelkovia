// Generated from site-config.js by scripts/sync-catalog.mjs.
export const products=[{"id":"episode-1","name":"Pixelkovia: Stratený signál","priceCents":1499,"pricing":{"referencePriceCents":null,"plannedStandardPriceCents":2999,"campaign":"early-bird"},"status":"available","description":"Celá prvá epizóda, 7 pracovných listov, rodičovský návod, diplom, checklist a nápovedy."},{"id":"story-book-before","name":"Ako vznikli Pixelkovia","priceCents":499,"status":"available","pricing":{"status":"current","campaign":null},"description":"Kniha prvá · tri samostatné rozprávky pred dobrodružstvom. "},{"id":"story-book-after","name":"Po veľkom záblesku","priceCents":499,"status":"available","pricing":{"status":"current","campaign":null},"description":"Kniha druhá · tri samostatné rozprávky po dobrodružstve. "},{"id":"atlas-pixelkov","name":"Atlas Pixelkov","priceCents":299,"status":"available","description":"Sedem Pixelkov, ich schopnosti a aktivity. Plánovaná samostatná cena; v uvádzacej ponuke k hre zdarma."}];
export const offer={"refundDays":14,"contactEmail":"roman.duris@gmail.com","bookIds":["story-book-before","story-book-after"],"atlasId":"atlas-pixelkov","completeBundleCents":1999,"campaign":"early-bird"};
export const product=id => products.find(p => p.id === id);
export const quote=(selected = [], baseId = 'episode-1', includeAtlas = true) => {
    if(!offer.bookIds.includes(baseId))baseId='episode-1';
    const books=offer.bookIds.filter(id=>id!==baseId&&selected.includes(id));
    const booksCents=books.reduce((sum,id)=>sum+product(id).priceCents,0);
    const subtotalCents=product(baseId).priceCents+booksCents;
    const bundleDiscountCents=baseId==='episode-1'&&books.length===2?subtotalCents-offer.completeBundleCents:0;
    return {books, booksCents, baseId, bundleDiscountCents, subtotalCents, atlasIncluded:Boolean(includeAtlas), atlasCents:0, totalCents:subtotalCents-bundleDiscountCents};
  };
