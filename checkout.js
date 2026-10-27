(() => {
  'use strict';
  const {product,money,offer,quote} = SITE_CONFIG;
  const form = document.querySelector('#checkout-form');
  const selected = new Set();
  if (new URLSearchParams(location.search).get('extras') === 'all') offer.missionIds.forEach(id => selected.add(id));
  document.querySelectorAll('[data-base-price]').forEach(el=>{el.textContent=money(product('episode-1').priceCents);});
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1';
  const base=product(baseId);
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(b=>b.id===id);
  if(baseId!=='episode-1'){
    const b=bookInfo(baseId);selected.clear();
    document.querySelector('.checkout-intro p').textContent='Samostatná kniha bez povinnosti vlastniť hru alebo druhý zväzok. Pracovná ponuka, platby sú vypnuté.';
    document.querySelector('.base-product').innerHTML=`<span class="checkout-step">VAŠA SAMOSTATNÁ KNIHA</span><div class="base-product-heading"><img src="${b.cover}" width="100" height="143" alt="Obálka knihy ${b.title}"><div><h2>${b.title}</h2><p>${b.subtitle}</p><strong>${money(base.priceCents)} · pracovná cena</strong></div></div><p>Tri uzavreté textové rozprávky. Bez potreby kúpy alebo dohrania hry.</p><a href="book-${b.key}-sample.html">Prečítať krátku ukážku →</a>`;
    document.querySelector('#mission-panel').hidden=true;
    document.querySelector('.checkout-summary .summary-row').innerHTML=`<span>${b.title}<small>Samostatná kniha · pracovná cena</small></span><strong>${money(base.priceCents)}</strong>`;
    document.querySelector('.delivery-row small').textContent='Digitálna kniha, bez poštovného';
  }
  document.querySelector('#book-options').innerHTML=offer.bookIds.filter(id=>id!==baseId).map(id=>{const p=product(id),b=bookInfo(id);return `<label class="book-choice"><input type="checkbox" name="book" value="${id}"><img src="${b.cover}" width="70" height="100" alt="Obálka: ${b.title}"><span><b>${p.name}</b><small>${b.when} · tri rozprávky</small><small>Pracovná cena · predaj pripravujeme</small></span><strong>+${money(p.priceCents)}</strong></label>`;}).join('');
  document.querySelector('[data-bundle-price]').textContent='+'+money(product('mission-bundle').priceCents);
  document.querySelector('[data-bundle-savings]').textContent=money(offer.missionIds.reduce((sum,id)=>sum+product(id).priceCents,0)-product('mission-bundle').priceCents);
  document.querySelector('#mission-options').innerHTML=offer.missionIds.map(id=>{const p=product(id);return `<label class="mission-choice"><input type="checkbox" name="mission" value="${id}"><img src="assets/sales/characters/${p.character}.webp" alt="" width="52" height="52"><span><b>${p.name}</b><small>Samostatné doplnkové dobrodružstvo</small></span><strong>+${money(p.priceCents)}</strong></label>`;}).join('');
  function update(){
    const q=quote([...selected],baseId),all=q.missions.length===offer.missionIds.length;
    document.querySelector('#all-missions').checked=all;
    document.querySelector('#all-missions').indeterminate=q.missions.length>0&&!all;
    document.querySelectorAll('[name="mission"]').forEach(input=>{input.checked=selected.has(input.value);});
    document.querySelector('#summary-extras').innerHTML=all?`<div class="summary-row"><span>3 bonusové misie<small>Balík: Piko, Pingy, Miky</small></span><strong>${money(q.extrasCents)}</strong></div><p class="summary-savings">Vďaka balíku ušetríte ${money(q.savingsCents)}.</p>`:q.missions.map(id=>`<div class="summary-row"><span>${product(id).name}<small>Voliteľné rozšírenie</small></span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    document.querySelectorAll('[name="book"]').forEach(input=>{input.checked=selected.has(input.value);});
    document.querySelector('#summary-books').innerHTML=q.books.map(id=>`<div class="summary-row"><span>${product(id).name}<small>Voliteľná kniha · pracovná cena</small></span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#button-total').textContent=money(q.totalCents);
    document.querySelector('#extras-status').textContent=all?`Vybrané všetky 3 misie. Balíková cena ${money(q.extrasCents)} sa použila automaticky.`:q.missions.length?`Vybrané ${q.missions.length===1?'1 bonusové dobrodružstvo':'2 bonusové dobrodružstvá'} za ${money(q.extrasCents)}.${q.missions.length===2?' Všetky tri v balíku za '+money(product('mission-bundle').priceCents)+' vyjdú o '+money(q.extrasCents-product('mission-bundle').priceCents)+' menej.':''}`:'Zatiaľ ste nepridali žiadnu bonusovú misiu.';
  }
  form.addEventListener('change',event=>{
    const input=event.target;
    if(input.id==='all-missions'){offer.missionIds.forEach(id=>selected.delete(id));if(input.checked)offer.missionIds.forEach(id=>selected.add(id));}
    else if(input.name==='mission'||input.name==='book'){if(input.checked)selected.add(input.value);else selected.delete(input.value);}
    else return;
    update();
  });
  // Payment intentionally stays disabled, including implicit Enter submissions.
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('input'))event.preventDefault();});
  update();
})();
