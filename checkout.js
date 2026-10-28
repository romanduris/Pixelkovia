(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const standardGameCents=product('episode-1').pricing.plannedStandardPriceCents;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const requested=new URLSearchParams(location.search).get('product');
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  const returned=new URLSearchParams(location.search).get('session_id');
  let returnedSummary=null;
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let atlasSelected=true,giftSelected=false,voucherCode='';
  const mobileBar=document.querySelector('#mobile-checkout-bar'),mobileBuy=document.querySelector('#mobile-buy');
  let mainBuyVisible=false;
  const voucherDialog=document.querySelector('#voucher-dialog'),voucherInput=document.querySelector('#voucher-code');
  const voucherError=document.querySelector('#voucher-error'),voucherOpen=document.querySelector('#voucher-open');
  let previousOverflow;
  let configuration,embedded,creating=false,completed=false;
  // Both books are opt-in through one checkbox. Standalone books remain independent.
  document.querySelectorAll('[data-base-price]').forEach(el=>el.textContent=money(product(baseId).priceCents));
  document.querySelector('[data-planned-price]').textContent=money(product('episode-1').pricing.plannedStandardPriceCents);
  document.querySelector('[data-summary-base-price]').textContent=money(product(baseId).priceCents);
  document.querySelector('#summary-early-discount strong').textContent='−'+money(product('episode-1').pricing.plannedStandardPriceCents-product('episode-1').priceCents);
  if(!isGame){
    const book=bookInfo(baseId);
    document.querySelector('.summary-access').hidden=true;
    document.querySelector('.base-product').innerHTML=`<span class="checkout-step">VAŠA SAMOSTATNÁ KNIHA</span><div class="standalone-book">${cover(book)}<div><h2 id="base-heading">${book.title}</h2><p>${book.when}</p><strong>${money(product(baseId).priceCents)}</strong></div></div><p>Tri uzavreté rozprávky na spoločné čítanie. Bez potreby kúpy alebo dohrania hry.</p>${button(baseId)}`;
    document.querySelector('.summary-base').innerHTML=`<span>${book.title}</span><strong>${money(product(baseId).priceCents)}</strong>`;
    document.querySelector('.summary-price-note').textContent='Samostatné knihy · bez predplatného';
    document.querySelector('#summary-early-discount').hidden=true;
    document.querySelector('#books-heading').textContent='Pridajte aj druhú knihu';
  }
  const atlasMarkup=`<article class="checkout-addon atlas-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-atlas" name="atlas" checked aria-label="Pridať Atlas Pixelkov zdarma"></label><img src="assets/atlas/guardy.webp" width="48" height="60" alt="Guardy, sprievodca Atlasom Pixelkov"><div class="addon-copy"><label for="addon-atlas">Atlas Pixelkov</label><small>Sedem Pixelkov a ich schopnosti</small><a href="atlas.html" class="book-sample-link">Pozrieť Atlas ↗</a></div><div class="addon-price"><s aria-label="Plánovaná samostatná cena">${money(product(offer.atlasId).priceCents)}</s><strong>Teraz zdarma</strong></div></div></article>`;
  const booksMarkup=isGame?`<article class="checkout-addon book-bundle-option"><div class="addon-main"><label class="addon-check"><input id="select-bundle" type="checkbox" name="book-bundle" aria-label="Pridať obe ilustrované knihy za ${money(complete.totalCents-product(baseId).priceCents)}"></label><div class="book-pair">${offer.bookIds.map(id=>cover(bookInfo(id))).join('<span class="book-pair-plus" aria-hidden="true">+</span>')}</div><div class="addon-copy"><label for="select-bundle">Obe ilustrované knihy</label><small>6 rozprávok · približne 40 minút čítania</small>${button('collection','Pozrieť ukážku oboch kníh')}</div><div class="addon-price"><s>${money(complete.booksCents)}</s><strong>+${money(complete.totalCents-product(baseId).priceCents)}</strong></div></div></article>`:offer.bookIds.filter(id=>id!==baseId).map(id=>{
    const book=bookInfo(id);
    return `<article class="checkout-addon book-addon"><div class="addon-main"><label class="addon-check"><input type="checkbox" id="addon-${id}" name="book" value="${id}" aria-label="Pridať knihu ${book.title}"></label>${cover(book)}<div class="addon-copy"><label for="addon-${id}">${book.title}</label><small>3 samostatné rozprávky</small>${button(id,'Pozrieť ukážku')}</div><div class="addon-price"><strong>+${money(product(id).priceCents)}</strong></div></div></article>`;
  }).join('');
  const giftMarkup=isGame?`<article class="checkout-addon additional-game-addon"><div class="addon-main"><label class="addon-check"><input id="addon-gift-game" type="checkbox" name="gift-game" aria-describedby="gift-game-info" aria-label="Darovať dobrodružstvo ďalšej rodine"></label><img src="assets/sales/characters/piko.webp" width="48" height="60" alt=""><div class="addon-copy"><label for="addon-gift-game">Darujte dobrodružstvo</label><small id="gift-game-info">Poznáte rodinu, ktorej by sa Pixelkovia tiež páčili? Darujte im ich za špeciálnu cenu.</small></div><div class="addon-price"><s>${money(standardGameCents)}</s><strong>+${money(offer.additionalGameCents)}</strong></div></div></article>`:'';
  document.querySelector('#book-options').innerHTML=atlasMarkup+booksMarkup+giftMarkup;
  function refreshMobileBar(){
    const keyboard=window.visualViewport&&innerHeight-window.visualViewport.height>180;
    mobileBar.hidden=innerWidth>700||mainBuyVisible||creating||completed||Boolean(returned)||form.hidden||!!document.querySelector('dialog[open]')||keyboard;
  }
  function update(){
    const q=quote([...selected],baseId,atlasSelected,voucherCode,giftSelected);
    document.querySelectorAll('[name="book"]:not(:disabled)').forEach(input=>input.checked=selected.has(input.value));
    document.querySelector('[name="atlas"]').checked=q.atlasIncluded;
    document.querySelector('.gift-row').hidden=!q.atlasIncluded;
    if(isGame)document.querySelector('#select-bundle').checked=q.books.length===2;
    document.querySelector('#summary-books').innerHTML=isGame&&q.books.length===2?`<div class="summary-row"><span>Obe ilustrované knihy</span><strong>${money(q.booksCents-q.bundleDiscountCents)}</strong></div>`:q.books.map(id=>`<div class="summary-row"><span>${product(id).name}</span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    const giftRow=document.querySelector('#summary-additional-game');giftRow.hidden=!q.giftGame;giftRow.querySelector('strong').textContent=money(q.giftCents);
    const giftDiscount=document.querySelector('#summary-gift-discount');giftDiscount.hidden=!q.giftGame;giftDiscount.querySelector('strong').textContent='−'+money(standardGameCents-offer.additionalGameCents);
    if(isGame)document.querySelector('#addon-gift-game').checked=q.giftGame;
    document.querySelector('#email-note').textContent=isGame?'Po zaplatení vám e-mailom príde prístup k hre a zakúpeným doplnkom.'+(q.giftGame?' Dostanete aj samostatný prístup na darovanie.':''):'Po zaplatení vám e-mailom príde prístup k zakúpeným knihám.';
    const discount=document.querySelector('#summary-discount');
    discount.hidden=q.bundleDiscountCents===0;
    discount.innerHTML=q.bundleDiscountCents?`<span>Zľava na balík kníh</span><strong>−${money(q.bundleDiscountCents)}</strong>`:'';
    const standardTotal=(isGame?standardGameCents:product(baseId).priceCents)+q.booksCents+(q.giftGame?standardGameCents:0);
    const saving=standardTotal-(q.totalCents+q.voucherDiscountCents);
    document.querySelector('#price-calculation').hidden=saving===0;
    document.querySelector('#summary-saving').textContent=money(saving);
    const voucher=document.querySelector('#summary-voucher');
    voucher.hidden=!q.voucher;
    voucher.innerHTML=q.voucher?`<span>Voucher ${q.voucher} · ${q.voucher==='1e'?'nákup za 1 €':'zľava 100 %'}</span><strong>−${money(q.voucherDiscountCents)}</strong>`:'';
    voucherOpen.textContent=q.voucher?'Zľavový kód je uplatnený':'Mám zľavový kód';
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#summary-saving-label').textContent=isGame&&!q.books.length&&!q.giftGame?'Zvýhodnenie pri Early Access:':'Zvýhodnenie oproti štandardným cenám:';
    if(returnedSummary)document.querySelector('#order-total').textContent=money(returnedSummary.totalCents);
    document.querySelector('.checkout-buy').disabled=!configuration?.enabled||creating||completed;
    document.querySelector('#mobile-order-total').textContent=money(q.totalCents);
    mobileBuy.disabled=!configuration?.enabled||creating||completed;
    mobileBuy.firstChild.textContent=q.totalCents===0?'Pokračovať zdarma ':'Pokračovať k platbe ';
    refreshMobileBar();
  }
  form.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='gift-game'){giftSelected=input.checked;update();return;}
    if(input.name==='atlas'){atlasSelected=input.checked;update();return;}
    if(input.name==='book-bundle'){offer.bookIds.forEach(id=>input.checked?selected.add(id):selected.delete(id));update();return;}
    if(input.name!=='book'||input.disabled)return;
    if(input.checked)selected.add(input.value);else selected.delete(input.value);update();
  });
  const buy=document.querySelector('.checkout-buy'),panel=document.querySelector('#payment-panel');
  mobileBuy.addEventListener('click',()=>buy.click());
  new IntersectionObserver(entries=>{mainBuyVisible=entries[0].isIntersecting;refreshMobileBar();},{threshold:0.15}).observe(buy);
  window.addEventListener('resize',refreshMobileBar);window.visualViewport?.addEventListener('resize',refreshMobileBar);
  document.addEventListener('click',()=>requestAnimationFrame(refreshMobileBar));
  document.addEventListener('close',refreshMobileBar,true);
  form.addEventListener('submit',event=>{event.preventDefault();buy.click();});
  function loadStripe(){if(window.Stripe)return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://js.stripe.com/endive/stripe.js';script.onload=resolve;script.onerror=()=>reject(Error('Platobný formulár sa nepodarilo načítať. Skúste to znova.'));document.head.append(script);});}
  function lockOrder(locked){form.querySelectorAll('input,button').forEach(i=>{if(!panel.contains(i))i.disabled=locked;});if(!locked)document.querySelector(`[name="book"][value="${baseId}"]`)?.setAttribute('disabled','');}
  function showSummary(summary){
    const valid=summary&&Array.isArray(summary.labels)&&summary.labels.length<=5&&summary.labels.every(s=>typeof s==='string'&&s.length<160)&&Number.isInteger(summary.totalCents)&&summary.totalCents>=0;
    returnedSummary=valid?summary:null;
    document.querySelector('#returned-order-items').hidden=!valid;
    document.querySelector('.summary-total').hidden=!valid;
    if(valid){document.querySelector('#returned-order-items').textContent=summary.labels.join(' · ');document.querySelector('#order-total').textContent=money(summary.totalCents);}
  }
  function rememberSummary(session){
    // Presentation only. This cache never confirms payment or grants access.
    const labels=[baseId,...selected,...(atlasSelected?[offer.atlasId]:[])].map(id=>product(id).name);
    if(giftSelected)labels.push('Druhá hra pre ďalšiu rodinu');
    const summary={sessionId:session.sessionId,labels,totalCents:session.totalCents,at:Date.now()};
    try{sessionStorage.setItem('pixelkovia-checkout-summary',JSON.stringify(summary));}catch{}
  }
  async function paymentStatus(sessionId){
    document.querySelector('.payment-method-note').hidden=true;
    form.classList.add('payment-open');panel.hidden=false;lockOrder(true);refreshMobileBar();document.querySelector('#change-order').disabled=true;
    const target=document.querySelector('#payment-status');target.textContent='Overujem potvrdenie objednávky…';
    for(let i=0;i<8;i++){
      try{
        const r=await fetch('/api/checkout/status?session_id='+encodeURIComponent(sessionId),{cache:'no-store'});const value=await r.json();
        if(value.paid){
          completed=true;update();document.querySelector('#payment-heading').textContent='Ďakujeme za objednávku';
          const confirmed=value.noPaymentRequired?'✓ Objednávka s voucherom je potvrdená.':'✓ Platba je potvrdená.';
          target.textContent=confirmed+(value.orderCount===2?(value.delivered?' Dva e-maily s rôznymi heslami sme odovzdali na odoslanie. Druhý je pre ďalšiu rodinu.':' Pripravujeme dva samostatné e-maily s rôznymi heslami. Druhý môžete preposlať ďalšej rodine.'):(value.delivered?' E-mail s prístupom sme odovzdali na odoslanie. Skontrolujte aj priečinok Spam.':' Prístupový e-mail pre vás pripravujeme.'));
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
    const checkout=Stripe(configuration.publishableKey,{locale:'sk'}).initCheckoutElementsSdk({
      clientSecret:session.clientSecret,
      adaptivePricing:{allowed:false},
      defaultValues:{billingAddress:{address:{country:'SK'}}},
      elementsOptions:{appearance:{
        theme:'night',inputs:'condensed',labels:'above',
        variables:{colorPrimary:'#ace9cf',colorBackground:'#101b2d',colorText:'#f1ede5',colorTextSecondary:'#b2c2d3',colorTextPlaceholder:'#9aaac0',colorDanger:'#ffb89b',accessibleColorOnColorPrimary:'#123228',fontFamily:'Inter, system-ui, sans-serif',fontSizeBase:'16px',borderRadius:'7px',spacingUnit:'3px'}
      }}
    });
    const loaded=await checkout.loadActions();
    if(loaded.type!=='success')throw Error('Platobný formulár sa nepodarilo načítať. Skúste to znova.');
    const change=document.querySelector('#change-order'),status=document.querySelector('#payment-status'),pay=document.querySelector('#stripe-pay');
    const walletSlot=document.querySelector('#express-checkout-slot'),separator=document.querySelector('#wallet-separator');
    let alive=true,confirming=false,cardReady=session.totalCents===0,priceValid=true,payment,wallet;
    const syncPayButton=()=>{pay.disabled=confirming||!cardReady||!priceValid;};
    function displayTotal(current){
      const amount=current.total.total.minorUnitsAmount;
      if(current.currency!=='eur'||current.minorUnitsAmountDivisor!==100||amount!==session.totalCents)throw Error('Cena platby sa zmenila. Vráťte sa k objednávke a skúste to znova.');
      document.querySelector('#order-total').textContent=money(amount);
      pay.textContent=amount===0?'Potvrdiť objednávku zdarma':'Zaplatiť '+money(amount);
    }
    displayTotal(loaded.actions.getSession());
    checkout.on('change',current=>{
      if(!alive)return;
      try{displayTotal(current);priceValid=true;syncPayButton();}catch(error){priceValid=false;syncPayButton();status.textContent=error.message;}
    });
    async function confirm(event){
      if(!alive||confirming)return;
      confirming=true;pay.disabled=true;change.disabled=true;status.textContent=session.totalCents===0?'Potvrdzujem objednávku…':'Spracúvam platbu…';
      try{
        displayTotal(loaded.actions.getSession());
        const result=await loaded.actions.confirm({redirect:'if_required',...(event?{expressCheckoutConfirmEvent:event}:{})});
        if(!alive)return;
        if(result.type==='success'){
          embedded?.destroy();embedded=null;
          await paymentStatus(session.sessionId);
        }else{
          status.textContent=result.error?.message||'Platbu sa nepodarilo dokončiť. Skúste to znova.';
          event?.paymentFailed?.({reason:'fail',message:status.textContent});
        }
      }catch{
        if(alive){status.textContent='Platbu sa nepodarilo dokončiť. Skúste to znova.';event?.paymentFailed?.({reason:'fail',message:status.textContent});}
      }finally{
        confirming=false;
        if(alive){syncPayButton();change.disabled=false;}
      }
    }
    const submit=()=>confirm();
    const destroy=()=>{alive=false;pay.removeEventListener('click',submit);payment?.destroy();wallet?.destroy();pay.hidden=true;pay.disabled=true;walletSlot.hidden=true;separator.hidden=true;};
    document.querySelector('#payment-heading').textContent=session.totalCents===0?'Potvrdenie objednávky zdarma':'Bezpečná platba';
    document.querySelector('.payment-method-note').hidden=session.totalCents===0;
    form.classList.add('payment-open');panel.hidden=false;walletSlot.hidden=false;separator.hidden=true;pay.hidden=false;pay.disabled=true;
    try{
      if(session.totalCents>0){
        payment=checkout.createPaymentElement({layout:'tabs',fields:{billingDetails:{email:'never',phone:'never'}},wallets:{applePay:'never',googlePay:'never',link:'never'}});
        payment.on('ready',()=>{if(alive){cardReady=true;syncPayButton();}});
        payment.on('loaderror',()=>{if(alive){cardReady=false;syncPayButton();status.textContent='Údaje karty sa nepodarilo načítať. Upravte objednávku a skúste to znova.';}});
        wallet=checkout.createExpressCheckoutElement({buttonHeight:44,layout:{maxColumns:2,maxRows:1},paymentMethods:{applePay:'always',googlePay:'always',link:'never',paypal:'never',amazonPay:'never',klarna:'never'}});
        const showWallets=available=>{if(alive){walletSlot.hidden=!available;separator.hidden=!available;}};
        wallet.on('ready',event=>showWallets(Boolean(event.availablePaymentMethods?.applePay||event.availablePaymentMethods?.googlePay)));
        // Availability can change after ready while Stripe checks the browser's wallets.
        wallet.on('availablepaymentmethodschange',event=>showWallets(Boolean(event.paymentMethods?.applePay?.available||event.paymentMethods?.googlePay?.available)));
        wallet.on('confirm',confirm);
        payment.mount('#payment-slot');wallet.mount('#express-checkout-slot');
      }else{walletSlot.hidden=true;pay.disabled=false;}
      pay.addEventListener('click',submit);
      return {destroy};
    }catch(error){destroy();throw error;}
  }
  buy.addEventListener('click',async()=>{
    if(!configuration?.enabled||creating||!form.reportValidity())return;
    creating=true;lockOrder(true);update();document.querySelector('#payment-note').textContent='Pripravujem zabezpečený formulár…';
    try{const response=await fetch('/api/checkout/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({baseId,books:[...selected],atlasIncluded:atlasSelected,voucherCode,giftGame:giftSelected,uiMode:'elements',email:form.elements.email.value.trim()})});const session=await response.json();if(!response.ok)throw Error(session.error||'Platbu sa nepodarilo pripraviť.');await loadStripe();rememberSummary(session);document.querySelector('#payment-status').textContent='';embedded=await mountPayment(session);panel.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#payment-note').textContent='Objednávku dokončite v zabezpečenom formulári nižšie.';}
    catch(error){embedded?.destroy();embedded=null;panel.hidden=true;form.classList.remove('payment-open');lockOrder(false);document.querySelector('#payment-slot').replaceChildren();document.querySelector('#payment-note').textContent=error.message;creating=false;update();}
  });
  function clearVoucherError(){voucherError.hidden=true;voucherError.textContent='';voucherInput.removeAttribute('aria-invalid');}
  voucherOpen.addEventListener('click',()=>{
    if(creating||completed)return;
    voucherInput.value=voucherCode;clearVoucherError();document.querySelector('#voucher-remove').hidden=!voucherCode;
    previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';voucherDialog.showModal();refreshMobileBar();voucherInput.focus();
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
    const q=quote([...selected],baseId,atlasSelected,voucherInput.value,giftSelected);
    if(!q.voucher){voucherError.textContent=voucherInput.value.trim()?'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.':'Zadajte kód voucheru.';voucherError.hidden=false;voucherInput.setAttribute('aria-invalid','true');voucherInput.focus();return;}
    voucherCode=q.voucher;update();voucherDialog.close();
  });
  document.querySelector('#voucher-remove').addEventListener('click',()=>{voucherCode='';update();voucherDialog.close();});
  document.querySelector('#change-order').addEventListener('click',()=>{embedded?.destroy();embedded=null;panel.hidden=true;form.classList.remove('payment-open');creating=false;document.querySelector('#payment-status').textContent='';document.querySelector('#payment-note').textContent='Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.';lockOrder(false);update();form.scrollIntoView({behavior:'smooth',block:'start'});});
  fetch('/api/checkout/config',{cache:'no-store'}).then(r=>r.json()).then(value=>{configuration=value;document.querySelector('#payment-note').textContent=value.enabled?'Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.':'Platby ešte pripravujeme. Objednávka ani platba sa teraz nespustí.';update();}).catch(()=>{document.querySelector('#payment-note').textContent='Platobnú službu sa nepodarilo načítať. Skúste stránku obnoviť.';});
  update();
  if(returned){
    form.classList.add('bank-return');let summary;
    try{const cached=JSON.parse(sessionStorage.getItem('pixelkovia-checkout-summary'));if(cached?.sessionId===returned&&Date.now()-cached.at<86400000)summary=cached;}catch{}
    showSummary(summary);document.querySelector('#change-order').hidden=true;paymentStatus(returned);
  }
})();
