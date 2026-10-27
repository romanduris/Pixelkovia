(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds),single=quote([offer.bookIds[0]]);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let voucherCode='';
  const voucherDialog=document.querySelector('#voucher-dialog'),voucherInput=document.querySelector('#voucher-code');
  const voucherError=document.querySelector('#voucher-error'),voucherOpen=document.querySelector('#voucher-open');
  let previousOverflow;
  // Paid books are selected only through their controls.
  document.querySelectorAll('[data-base-price]').forEach(el=>el.textContent=money(product(baseId).priceCents));
  document.querySelector('[data-planned-price]').textContent=money(product('episode-1').pricing.plannedStandardPriceCents);
  if(!isGame){
    const book=bookInfo(baseId);
    document.querySelector('.base-product').innerHTML=`<span class="checkout-step">VAŠA SAMOSTATNÁ KNIHA</span><div class="standalone-book">${cover(book)}<div><h2 id="base-heading">${book.title}</h2><p>${book.when}</p><strong>${money(product(baseId).priceCents)}</strong></div></div><p>Tri uzavreté rozprávky na spoločné čítanie. Bez potreby kúpy alebo dohrania hry.</p>${button(baseId)}`;
    document.querySelector('.summary-base').innerHTML=`<span>${book.title}<small>Samostatná kniha</small></span><strong>${money(product(baseId).priceCents)}</strong>`;
    document.querySelector('.delivery-row small').textContent='Digitálna kniha, bez poštovného';
    document.querySelector('.summary-price-note').textContent='Samostatné knihy · bez predplatného';
  }
  document.querySelector('#book-options').innerHTML=offer.bookIds.map(id=>{
    const book=bookInfo(id),included=id===baseId;
    return `<article class="checkout-addon book-addon"><div class="addon-main"><input type="checkbox" id="addon-${id}" name="book" value="${id}" ${included?'checked disabled':''} aria-describedby="info-${id}">${cover(book)}<div><label for="addon-${id}">${book.title}</label><small id="info-${id}">${book.when}${included?' · Vaša vybraná kniha':''}</small><strong>${included?'V hlavnej ponuke':'+'+money(product(id).priceCents)}</strong></div></div><p>${book.key==='before'?'Spoznajte prvé svetielko, vznik Pixelkov a tajomstvo bezpečnej brány.':'Tri nové príbehy o obnovenej mape, záhadných pípnutiach a odpočinku svetielok.'}</p>${button(id)}</article>`;
  }).join('')+`<article class="checkout-addon atlas-addon"><div class="addon-main"><span class="included-icon" aria-hidden="true">✓</span><img src="assets/atlas/piko.webp" width="72" height="90" alt="Piko"><div><h3>Atlas Pixelkov</h3><small>Plánovaná samostatná cena ${money(product(offer.atlasId).priceCents)}</small><strong>ZDARMA${isGame?' K HRE':''}</strong></div></div><p>Sedem Pixelkov, ich schopnosti a malé aktivity.</p><p class="atlas-included">Zahrnuté automaticky – teraz zdarma. Túto položku nemožno odobrať; do súčtu sa započítava 0,00 €.</p><a href="atlas.html" class="book-sample-link">Pozrieť Atlas →</a></article>`;
  function update(){
    const q=quote([...selected],baseId,voucherCode);
    document.querySelectorAll('[name="book"]:not(:disabled)').forEach(input=>input.checked=selected.has(input.value));
    document.querySelector('#summary-books').innerHTML=q.books.map(id=>`<div class="summary-row"><span>${product(id).name}<small>Voliteľná kniha</small></span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    const discount=document.querySelector('#summary-discount');
    discount.hidden=q.bundleDiscountCents===0;
    discount.innerHTML=q.bundleDiscountCents?`<span>Zľava za kompletný balík</span><strong>−${money(q.bundleDiscountCents)}</strong>`:'';
    const voucher=document.querySelector('#summary-voucher');
    voucher.hidden=!q.voucher;
    voucher.innerHTML=q.voucher?`<span>Voucher ${q.voucher} · zľava 100 %</span><strong>−${money(q.voucherDiscountCents)}</strong>`:'';
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#button-total').textContent=money(q.totalCents);
    document.querySelector('#books-status').textContent=!isGame?'Knihy sú samostatné. Vyberáte si len to, čo chcete čítať.':q.books.length===2?`Skvelá voľba! Obe knihy máte teraz v kompletnom balíku za zvýhodnenú cenu ${money(complete.totalCents)}.`:q.books.length===1?`S jednou knihou je cena ${money(single.totalCents)}. Pridaním druhej bude kompletný balík stáť ${money(complete.totalCents)} – rozdiel je ${money(complete.totalCents-single.totalCents)}.`:`Knihy sú voliteľné. Pri výbere oboch sa kompletný balík automaticky prepočíta na ${money(complete.totalCents)}.`;
  }
  form.addEventListener('change',event=>{
    const input=event.target;if(input.name!=='book'||input.disabled)return;
    if(input.checked)selected.add(input.value);else selected.delete(input.value);update();
  });
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('input'))event.preventDefault();});
  const clearVoucherError=()=>{
    voucherError.hidden=true;voucherError.textContent='';voucherInput.removeAttribute('aria-invalid');
  };
  voucherOpen.addEventListener('click',()=>{
    voucherInput.value=voucherCode;clearVoucherError();
    document.querySelector('#voucher-remove').hidden=!voucherCode;
    previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    voucherDialog.showModal();voucherInput.focus();
  });
  document.querySelector('#voucher-close').addEventListener('click',()=>voucherDialog.close());
  voucherDialog.addEventListener('click',event=>{
    if(event.target!==voucherDialog)return;
    const r=voucherDialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)voucherDialog.close();
  });
  voucherDialog.addEventListener('close',()=>{
    document.body.style.overflow=previousOverflow;voucherOpen.focus({preventScroll:true});
  });
  voucherInput.addEventListener('input',clearVoucherError);
  document.querySelector('#voucher-form').addEventListener('submit',event=>{
    event.preventDefault();
    const q=quote([...selected],baseId,voucherInput.value);
    if(!q.voucher){
      voucherError.textContent=voucherInput.value.trim()?'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.':'Zadajte kód voucheru.';
      voucherError.hidden=false;voucherInput.setAttribute('aria-invalid','true');voucherInput.focus();return;
    }
    voucherCode=q.voucher;update();voucherDialog.close();
  });
  document.querySelector('#voucher-remove').addEventListener('click',()=>{
    voucherCode='';update();voucherDialog.close();
  });
  update();
})();
