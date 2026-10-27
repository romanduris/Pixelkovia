(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds),single=quote([offer.bookIds[0]]);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let atlasSelected=true;
  const bundleButton=document.querySelector('#select-bundle');
  let configuration,embedded,creating=false;
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
    const q=quote([...selected],baseId,atlasSelected);
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
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#button-total').textContent=money(q.totalCents);
    document.querySelector('.checkout-buy').disabled=!configuration?.enabled||creating;
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
  const buy=document.querySelector('.checkout-buy'),panel=document.querySelector('#payment-panel');
  form.addEventListener('submit',event=>{event.preventDefault();buy.click();});
  function loadStripe(){if(window.Stripe)return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://js.stripe.com/endive/stripe.js';script.onload=resolve;script.onerror=()=>reject(Error('Platobný formulár sa nepodarilo načítať. Skúste to znova.'));document.head.append(script);});}
  async function paymentStatus(sessionId){panel.hidden=false;const target=document.querySelector('#payment-status');target.textContent='Overujem potvrdenie platby…';for(let i=0;i<8;i++){try{const r=await fetch('/api/checkout/status?session_id='+encodeURIComponent(sessionId),{cache:'no-store'});const value=await r.json();if(value.paid){target.textContent=value.delivered?'✓ Platba je potvrdená. E-mail s prístupom sme odovzdali na odoslanie. Skontrolujte aj priečinok Spam.':'✓ Platba je potvrdená. Prístupový e-mail pre vás pripravujeme.';document.querySelector('#change-order').hidden=true;return;}}catch{}await new Promise(resolve=>setTimeout(resolve,1500));}target.textContent='Potvrdenie platby sa ešte spracúva. Prístup vám po overení úhrady pošleme automaticky e-mailom.';}
  buy.addEventListener('click',async()=>{
    if(!configuration?.enabled||creating||!form.reportValidity())return;
    creating=true;update();document.querySelector('#payment-note').textContent='Pripravujem zabezpečený formulár…';
    try{const response=await fetch('/api/checkout/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({baseId,books:[...selected],atlasIncluded:atlasSelected,email:form.elements.email.value.trim(),name:form.elements.name.value.trim()})});const session=await response.json();if(!response.ok)throw Error(session.error||'Platbu sa nepodarilo pripraviť.');await loadStripe();embedded=await Stripe(configuration.publishableKey).createEmbeddedCheckoutPage({clientSecret:session.clientSecret,onComplete:()=>{embedded?.destroy();paymentStatus(session.sessionId);}});panel.hidden=false;embedded.mount('#payment-slot');form.querySelectorAll('input,button').forEach(i=>i.disabled=true);panel.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#payment-note').textContent='Platbu dokončite v zabezpečenom formulári nižšie.';}
    catch(error){document.querySelector('#payment-note').textContent=error.message;creating=false;update();}
  });
  document.querySelector('#change-order').addEventListener('click',()=>{embedded?.destroy();embedded=null;panel.hidden=true;creating=false;form.querySelectorAll('input,button').forEach(i=>i.disabled=false);document.querySelector(`[name="book"][value="${baseId}"]`)?.setAttribute('disabled','');update();});
  fetch('/api/checkout/config',{cache:'no-store'}).then(r=>r.json()).then(value=>{configuration=value;document.querySelector('#payment-note').textContent=value.enabled?'Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.':'Platby ešte pripravujeme. Objednávka ani platba sa teraz nespustí.';update();}).catch(()=>{document.querySelector('#payment-note').textContent='Platobnú službu sa nepodarilo načítať. Skúste stránku obnoviť.';});
  const returned=new URLSearchParams(location.search).get('session_id');if(returned)paymentStatus(returned);
  update();
})();
