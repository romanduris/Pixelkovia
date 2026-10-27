(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds),single=quote([offer.bookIds[0]]);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let voucherCode='',atlasSelected=true;
  const bundleButton=document.querySelector('#select-bundle');
  const voucherDialog=document.querySelector('#voucher-dialog'),voucherInput=document.querySelector('#voucher-code');
  const voucherError=document.querySelector('#voucher-error'),voucherOpen=document.querySelector('#voucher-open');
  let previousOverflow;
  // Paid books require an explicit checkbox or complete-bundle selection.
  document.querySelectorAll('[data-base-price]').forEach(el=>el.textContent=money(product(baseId).priceCents));
  document.querySelector('[data-planned-price]').textContent=money(product('episode-1').pricing.plannedStandardPriceCents);
  if(!isGame){
    const book=bookInfo(baseId);
    document.querySelector('.base-product').innerHTML=`<span class="checkout-step">VAŠA SAMOSTATNÁ KNIHA</span><div class="standalone-book">${cover(book)}<div><h2 id="base-heading">${book.title}</h2><p>${book.when}</p><strong>${money(product(baseId).priceCents)}</strong></div></div><p>Tri uzavreté rozprávky na spoločné čítanie. Bez potreby kúpy alebo dohrania hry.</p>${button(baseId)}`;
    document.querySelector('.summary-base').innerHTML=`<span>${book.title}</span><strong>${money(product(baseId).priceCents)}</strong>`;
    document.querySelector('.summary-price-note').textContent='Samostatné knihy · bez predplatného';
    bundleButton.hidden=true;
  }
  document.querySelector('[data-complete-price]').textContent=money(complete.totalCents);
  document.querySelector('[data-bundle-subtotal]').textContent=money(complete.subtotalCents);
  document.querySelector('[data-bundle-saving]').textContent=money(complete.bundleDiscountCents);
  document.querySelector('#book-options').innerHTML=offer.bookIds.map(id=>{
    const book=bookInfo(id),included=id===baseId;
    return `<article class="checkout-addon book-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-${id}" name="book" value="${id}" ${included?'checked disabled':''} aria-describedby="info-${id}"></label>${cover(book)}<div class="addon-copy"><label for="addon-${id}">${book.title}</label><small id="info-${id}">3 rozprávky · ${book.key==='before'?'pred hrou':'po hre'}${included?' · Vybraná kniha':''}</small><div class="addon-meta"><strong>${included?'V ponuke':'+'+money(product(id).priceCents)}</strong>${button(id,'Ukážka')}</div></div></div></article>`;
  }).join('')+`<article class="checkout-addon atlas-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-atlas" name="atlas" value="${offer.atlasId}" checked aria-describedby="info-atlas"></label><img src="assets/atlas/piko.webp" width="48" height="60" alt=""><div class="addon-copy"><label for="addon-atlas">Atlas Pixelkov</label><small id="info-atlas">Sedem Pixelkov a ich schopnosti</small><div class="addon-meta"><strong>ZDARMA</strong><a href="atlas.html" class="book-sample-link">Pozrieť ↗</a></div></div></div></article>`;
  function update(){
    const q=quote([...selected],baseId,voucherCode,atlasSelected);
    document.querySelectorAll('[name="book"]:not(:disabled)').forEach(input=>input.checked=selected.has(input.value));
    document.querySelector('[name="atlas"]').checked=q.atlasIncluded;
    document.querySelector('.gift-row').hidden=!q.atlasIncluded;
    const allSelected=q.books.length===2&&q.atlasIncluded;
    bundleButton.classList.toggle('is-selected',allSelected);
    bundleButton.querySelector('.bundle-action').innerHTML=allSelected?'Celý balík je vybraný <span aria-hidden="true">✓</span>':'Vybrať celý balík jedným klikom <span aria-hidden="true">→</span>';
    document.querySelector('#summary-books').innerHTML=q.books.map(id=>`<div class="summary-row"><span>${product(id).name}</span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    const discount=document.querySelector('#summary-discount');
    discount.hidden=q.bundleDiscountCents===0;
    discount.innerHTML=q.bundleDiscountCents?`<span>Zľava za kompletný balík</span><strong>−${money(q.bundleDiscountCents)}</strong>`:'';
    const voucher=document.querySelector('#summary-voucher');
    voucher.hidden=!q.voucher;
    voucher.innerHTML=q.voucher?`<span>Voucher ${q.voucher} · zľava 100 %</span><strong>−${money(q.voucherDiscountCents)}</strong>`:'';
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#button-total').textContent=money(q.totalCents);
    document.querySelector('#books-status').textContent=!isGame?'Knihy fungujú aj samostatne, bez hry.':q.books.length===2?`Balíková zľava ${money(q.bundleDiscountCents)} je započítaná.`:q.books.length===1?`S druhou knihou celý balík za ${money(complete.totalCents)} (+${money(complete.totalCents-single.totalCents)}).`:'';
  }
  form.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='atlas'){atlasSelected=input.checked;update();return;}
    if(input.name!=='book'||input.disabled)return;
    if(input.checked)selected.add(input.value);else selected.delete(input.value);update();
  });
  bundleButton.addEventListener('click',()=>{
    if(!isGame)return;
    offer.bookIds.forEach(id=>selected.add(id));atlasSelected=true;update();
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
    const q=quote([...selected],baseId,voucherInput.value,atlasSelected);
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
