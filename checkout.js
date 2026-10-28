(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let atlasSelected=true,voucherCode='';
  const voucherDialog=document.querySelector('#voucher-dialog'),voucherInput=document.querySelector('#voucher-code');
  const voucherError=document.querySelector('#voucher-error'),voucherOpen=document.querySelector('#voucher-open');
  let previousOverflow;
  let configuration,embedded,creating=false,completed=false;
  // Both books are opt-in through one checkbox. Standalone books remain independent.
  document.querySelectorAll('[data-base-price]').forEach(el=>el.textContent=money(product(baseId).priceCents));
  document.querySelector('[data-planned-price]').textContent=money(product('episode-1').pricing.plannedStandardPriceCents);
  document.querySelector('[data-summary-base-price]').textContent=money(product('episode-1').pricing.plannedStandardPriceCents);
  document.querySelector('#summary-early-discount strong').textContent='−'+money(product('episode-1').pricing.plannedStandardPriceCents-product('episode-1').priceCents);
  if(!isGame){
    const book=bookInfo(baseId);
    document.querySelector('.base-product').innerHTML=`<span class="checkout-step">VAŠA SAMOSTATNÁ KNIHA</span><div class="standalone-book">${cover(book)}<div><h2 id="base-heading">${book.title}</h2><p>${book.when}</p><strong>${money(product(baseId).priceCents)}</strong></div></div><p>Tri uzavreté rozprávky na spoločné čítanie. Bez potreby kúpy alebo dohrania hry.</p>${button(baseId)}`;
    document.querySelector('.summary-base').innerHTML=`<span>${book.title}</span><strong>${money(product(baseId).priceCents)}</strong>`;
    document.querySelector('.summary-price-note').textContent='Samostatné knihy · bez predplatného';
    document.querySelector('#summary-early-discount').hidden=true;
    document.querySelector('.addons-panel .panel-description').textContent='Pridajte aj druhú knihu alebo si pozrite ukážky. Knihy fungujú samostatne, bez hry.';
  }
  const bookDescription=book=>book.key==='before'?'Tri rozprávky o prvom svetielku, vzniku Pixelkov a tajomstve bezpečnej brány.':'Tri rozprávky o stratenej mape, záhadných pípnutiach a svetielkach, ktoré potrebujú oddych.';
  const booksMarkup=isGame?`<article class="book-bundle-option"><label class="book-bundle-select" for="select-bundle"><input id="select-bundle" type="checkbox" name="book-bundle" aria-describedby="bundle-description"><span>Pridať balík oboch kníh<small>Ku hre takmer za polovicu</small></span><strong>+${money(complete.totalCents-product(baseId).priceCents)}<s>${money(complete.booksCents)}</s></strong></label><p id="bundle-description">Obe knihy spolu za ${money(complete.totalCents-product(baseId).priceCents)} namiesto ${money(complete.booksCents)}. Hra s knihami za ${money(complete.totalCents)}.</p><div class="book-bundle-books">${offer.bookIds.map(id=>{const book=bookInfo(id);return `<article class="bundle-book">${cover(book)}<div><h3>${book.title}</h3><p>${bookDescription(book)}</p>${button(id,'Ukážka')}</div></article>`;}).join('')}</div></article>`:offer.bookIds.filter(id=>id!==baseId).map(id=>{
    const book=bookInfo(id);
    return `<article class="checkout-addon book-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-${id}" name="book" value="${id}" aria-describedby="info-${id}"></label>${cover(book)}<div class="addon-copy"><label for="addon-${id}">${book.title}</label><small id="info-${id}">3 rozprávky · ${book.key==='before'?'pred hrou':'po hre'}</small><div class="addon-meta"><strong>+${money(product(id).priceCents)}</strong>${button(id,'Ukážka')}</div></div></div></article>`;
  }).join('');
  document.querySelector('#book-options').innerHTML=booksMarkup+`<article class="checkout-addon atlas-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-atlas" name="atlas" value="${offer.atlasId}" checked aria-describedby="info-atlas"></label><img src="assets/atlas/piko.webp" width="48" height="60" alt=""><div class="addon-copy"><label for="addon-atlas">Atlas Pixelkov</label><small id="info-atlas">Sedem Pixelkov a ich schopnosti</small><div class="addon-meta"><strong>ZDARMA</strong><a href="atlas.html" class="book-sample-link">Pozrieť ↗</a></div></div></div></article>`;
  function update(){
    const q=quote([...selected],baseId,atlasSelected,voucherCode);
    document.querySelectorAll('[name="book"]:not(:disabled)').forEach(input=>input.checked=selected.has(input.value));
    document.querySelector('[name="atlas"]').checked=q.atlasIncluded;
    document.querySelector('.gift-row').hidden=!q.atlasIncluded;
    if(isGame)document.querySelector('#select-bundle').checked=q.books.length===2;
    document.querySelector('#summary-books').innerHTML=q.books.map(id=>`<div class="summary-row"><span>${product(id).name}</span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    const discount=document.querySelector('#summary-discount');
    discount.hidden=q.bundleDiscountCents===0;
    discount.innerHTML=q.bundleDiscountCents?`<span>Zľava na balík kníh</span><strong>−${money(q.bundleDiscountCents)}</strong>`:'';
    const voucher=document.querySelector('#summary-voucher');
    voucher.hidden=!q.voucher;
    voucher.innerHTML=q.voucher?`<span>Voucher ${q.voucher} · zľava 100 %</span><strong>−${money(q.voucherDiscountCents)}</strong>`:'';
    voucherOpen.textContent=q.voucher?'Zľavový kód je uplatnený':'Mám zľavový kód';
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#button-total').textContent=money(q.totalCents);
    document.querySelector('.checkout-buy').disabled=!configuration?.enabled||creating||completed;
    document.querySelector('#books-status').textContent=isGame&&q.books.length===2?'Obe knihy sú pridané. Balíková zľava je započítaná.':'';
  }
  form.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='atlas'){atlasSelected=input.checked;update();return;}
    if(input.name==='book-bundle'){offer.bookIds.forEach(id=>input.checked?selected.add(id):selected.delete(id));update();return;}
    if(input.name!=='book'||input.disabled)return;
    if(input.checked)selected.add(input.value);else selected.delete(input.value);update();
  });
  const buy=document.querySelector('.checkout-buy'),panel=document.querySelector('#payment-panel');
  form.addEventListener('submit',event=>{event.preventDefault();buy.click();});
  function loadStripe(){if(window.Stripe)return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://js.stripe.com/endive/stripe.js';script.onload=resolve;script.onerror=()=>reject(Error('Platobný formulár sa nepodarilo načítať. Skúste to znova.'));document.head.append(script);});}
  function lockOrder(locked){form.querySelectorAll('input,button').forEach(i=>i.disabled=locked);if(!locked)document.querySelector(`[name="book"][value="${baseId}"]`)?.setAttribute('disabled','');}
  function showSummary(summary){
    const valid=summary&&Array.isArray(summary.labels)&&summary.labels.length<=4&&summary.labels.every(s=>typeof s==='string'&&s.length<160)&&Number.isInteger(summary.totalCents)&&summary.totalCents>=0;
    document.querySelector('#payment-summary').hidden=!valid;
    if(valid){document.querySelector('#payment-order-items').textContent=summary.labels.join(' · ');document.querySelector('#payment-order-total').textContent=money(summary.totalCents);}
  }
  function rememberSummary(session){
    // Presentation only. This cache never confirms payment or grants access.
    const labels=[baseId,...selected,...(atlasSelected?[offer.atlasId]:[])].map(id=>product(id).name);
    const summary={sessionId:session.sessionId,labels,totalCents:session.totalCents,at:Date.now()};
    showSummary(summary);
    try{sessionStorage.setItem('pixelkovia-checkout-summary',JSON.stringify(summary));}catch{}
  }
  async function paymentStatus(sessionId){
    form.hidden=true;panel.hidden=false;lockOrder(true);document.querySelector('#change-order').disabled=true;
    const target=document.querySelector('#payment-status');target.textContent='Overujem potvrdenie objednávky…';
    for(let i=0;i<8;i++){
      try{
        const r=await fetch('/api/checkout/status?session_id='+encodeURIComponent(sessionId),{cache:'no-store'});const value=await r.json();
        if(value.paid){
          completed=true;update();document.querySelector('#payment-heading').textContent='Ďakujeme za objednávku';
          const confirmed=value.noPaymentRequired?'✓ Objednávka s voucherom je potvrdená.':'✓ Platba je potvrdená.';
          target.textContent=confirmed+(value.delivered?' E-mail s prístupom sme odovzdali na odoslanie. Skontrolujte aj priečinok Spam.':' Prístupový e-mail pre vás pripravujeme.');
          document.querySelector('#change-order').hidden=true;
          try{sessionStorage.removeItem('pixelkovia-checkout-summary');}catch{}
          return;
        }
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    target.textContent='Potvrdenie platby sa ešte spracúva. Prístup vám po overení úhrady pošleme automaticky e-mailom.';
    document.querySelector('#change-order').disabled=false;
  }
  async function mountPayment(session){
    const checkout=Stripe(configuration.publishableKey).initCheckoutFormSdk({
      clientSecret:session.clientSecret,
      appearance:{
        theme:'night',inputs:'spaced',labels:'above',
        variables:{colorPrimary:'#ace9cf',colorBackground:'#101b2d',colorText:'#f1ede5',colorTextSecondary:'#b2c2d3',colorTextPlaceholder:'#9aaac0',colorDanger:'#ffb89b',accessibleColorOnColorPrimary:'#123228',fontFamily:'Inter, system-ui, sans-serif',fontSizeBase:'16px',borderRadius:'7px',spacingUnit:'4px'}
      }
    });
    const loaded=await checkout.loadActions();
    if(loaded.type!=='success')throw Error('Platobný formulár sa nepodarilo načítať. Skúste to znova.');
    const paymentForm=checkout.createForm({layout:'expanded',expressCheckout:{paymentMethods:{link:'never'}}});
    const change=document.querySelector('#change-order'),status=document.querySelector('#payment-status');
    let alive=true,confirming=false;
    paymentForm.on('confirm',async event=>{
      if(!alive||confirming)return;
      confirming=true;change.disabled=true;status.textContent=session.totalCents===0?'Potvrdzujem objednávku…':'Spracúvam platbu…';
      try{
        const result=await loaded.actions.confirm({formConfirmEvent:event,redirect:'if_required'});
        if(!alive)return;
        if(result.type==='success'){
          embedded?.destroy();embedded=null;
          await paymentStatus(session.sessionId);
        }else{
          status.textContent=result.error?.message||'Platbu sa nepodarilo dokončiť. Skúste to znova.';
        }
      }catch{
        if(alive)status.textContent='Platbu sa nepodarilo dokončiť. Skúste to znova.';
      }finally{
        confirming=false;
        if(alive)change.disabled=false;
      }
    });
    document.querySelector('#payment-heading').textContent=session.totalCents===0?'Potvrdenie objednávky zdarma':'Bezpečná platba';
    form.hidden=true;panel.hidden=false;
    paymentForm.mount('#payment-slot');
    return {destroy(){alive=false;paymentForm.destroy();}};
  }
  buy.addEventListener('click',async()=>{
    if(!configuration?.enabled||creating||!form.reportValidity())return;
    creating=true;lockOrder(true);update();document.querySelector('#payment-note').textContent='Pripravujem zabezpečený formulár…';
    try{const response=await fetch('/api/checkout/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({baseId,books:[...selected],atlasIncluded:atlasSelected,voucherCode,email:form.elements.email.value.trim(),name:form.elements.name.value.trim()})});const session=await response.json();if(!response.ok)throw Error(session.error||'Platbu sa nepodarilo pripraviť.');await loadStripe();rememberSummary(session);document.querySelector('#payment-status').textContent='';embedded=await mountPayment(session);panel.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#payment-note').textContent='Objednávku dokončite v zabezpečenom formulári nižšie.';}
    catch(error){embedded?.destroy();embedded=null;panel.hidden=true;form.hidden=false;lockOrder(false);document.querySelector('#payment-slot').replaceChildren();document.querySelector('#payment-note').textContent=error.message;creating=false;update();}
  });
  function clearVoucherError(){voucherError.hidden=true;voucherError.textContent='';voucherInput.removeAttribute('aria-invalid');}
  voucherOpen.addEventListener('click',()=>{
    if(creating||completed)return;
    voucherInput.value=voucherCode;clearVoucherError();document.querySelector('#voucher-remove').hidden=!voucherCode;
    previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';voucherDialog.showModal();voucherInput.focus();
  });
  document.querySelector('#voucher-close').addEventListener('click',()=>voucherDialog.close());
  voucherDialog.addEventListener('click',event=>{
    if(event.target!==voucherDialog)return;
    const r=voucherDialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)voucherDialog.close();
  });
  voucherDialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;voucherOpen.focus({preventScroll:true});});
  voucherInput.addEventListener('input',clearVoucherError);
  document.querySelector('#voucher-form').addEventListener('submit',event=>{
    event.preventDefault();
    const q=quote([...selected],baseId,atlasSelected,voucherInput.value);
    if(!q.voucher){voucherError.textContent=voucherInput.value.trim()?'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.':'Zadajte kód voucheru.';voucherError.hidden=false;voucherInput.setAttribute('aria-invalid','true');voucherInput.focus();return;}
    voucherCode=q.voucher;update();voucherDialog.close();
  });
  document.querySelector('#voucher-remove').addEventListener('click',()=>{voucherCode='';update();voucherDialog.close();});
  document.querySelector('#change-order').addEventListener('click',()=>{embedded?.destroy();embedded=null;panel.hidden=true;form.hidden=false;creating=false;document.querySelector('#payment-status').textContent='';document.querySelector('#payment-note').textContent='Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.';lockOrder(false);update();form.scrollIntoView({behavior:'smooth',block:'start'});});
  fetch('/api/checkout/config',{cache:'no-store'}).then(r=>r.json()).then(value=>{configuration=value;document.querySelector('#payment-note').textContent=value.enabled?'Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.':'Platby ešte pripravujeme. Objednávka ani platba sa teraz nespustí.';update();}).catch(()=>{document.querySelector('#payment-note').textContent='Platobnú službu sa nepodarilo načítať. Skúste stránku obnoviť.';});
  const returned=new URLSearchParams(location.search).get('session_id');if(returned){try{const summary=JSON.parse(sessionStorage.getItem('pixelkovia-checkout-summary'));if(summary?.sessionId===returned&&Date.now()-summary.at<86400000)showSummary(summary);}catch{}paymentStatus(returned);}
  update();
})();
