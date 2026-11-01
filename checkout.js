(() => {
  'use strict';
  const {product,money,offer,quote}=SITE_CONFIG;
  const standardGameCents=product('episode-1').pricing.plannedStandardPriceCents;
  const {cover,button}=PIXELKOVIA_BOOK_PREVIEWS;
  const complete=quote(offer.bookIds);
  const form=document.querySelector('#checkout-form'),selected=new Set();
  const params=new URLSearchParams(location.search);
  let returned=params.get('session_id'),returnedCheckout=params.get('checkout_id');
  const purchaseStorage='pixelkovia-checkout-attempt';
  const pendingMessage='Overujeme vašu platbu. Prosíme, neplaťte znova. Potvrdenie a prístup vám po úspešnej úhrade prídu e-mailom.';
  let purchase=null;
  try{const value=JSON.parse(localStorage.getItem(purchaseStorage));if(value&&/^[-a-zA-Z0-9_]{32,100}$/.test(value.attemptKey)&&value.input&&typeof value.input.email==='string'&&Array.isArray(value.input.books)&&value.input.books.length<=2&&value.input.books.every(id=>offer.bookIds.includes(id))&&typeof value.input.atlasIncluded==='boolean'&&['episode-1',...offer.bookIds].includes(value.input.baseId))purchase=value;}catch{}
  if(returned&&purchase?.sessionId!==returned)purchase=null;
  if(!returned&&!returnedCheckout&&purchase?.phase==='paid'){try{localStorage.removeItem(purchaseStorage);}catch{}purchase=null;}
  const requested=params.get('product')||purchase?.input.baseId;
  const baseId=offer.bookIds.includes(requested)?requested:'episode-1',isGame=baseId==='episode-1';
  let returnedSummary=null;
  const bookInfo=id=>PIXELKOVIA_LIBRARY.find(book=>book.id===id);
  let atlasSelected=true,giftSelected=false,voucherCode='';
  const mobileBar=document.querySelector('#mobile-checkout-bar'),mobileBuy=document.querySelector('#mobile-buy');
  let mainBuyVisible=false;
  const voucherDialog=document.querySelector('#voucher-dialog'),voucherInput=document.querySelector('#voucher-code');
  const voucherError=document.querySelector('#voucher-error'),voucherOpen=document.querySelector('#voucher-open');
  let previousOverflow;
  let configuration,configurationPromise,embedded,stripeLoading,preparing=false,creating=false,completed=false,checking=false;
  function persistPurchase(){try{if(purchase)localStorage.setItem(purchaseStorage,JSON.stringify(purchase));else localStorage.removeItem(purchaseStorage);}catch{}}
  async function api(url,options={}){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),...options});const data=await response.json();if(!response.ok){const error=Error(data.error||pendingMessage);error.status=response.status;error.code=data.code;throw error;}return data;}
  const post=(url,input)=>api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  // No payment awaits diagnostics. Send fixed event names only, without Stripe
  // errors, field values, card data, email, URL or payment client secrets.
  function diagnostic(type,method='unknown'){
    const data={type,method,productId:baseId,attemptKey:purchase?.attemptKey};
    setTimeout(()=>{try{void fetch('/api/checkout/diagnostic',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true,signal:AbortSignal.timeout(4000)}).catch(()=>{});}catch{}},0);
  }
  function trackSession(session){purchase.sessionId=session.sessionId;returned=session.sessionId;returnedCheckout=null;persistPurchase();const url=new URL(location.href);url.searchParams.delete('checkout_id');url.searchParams.delete('canceled');url.searchParams.set('session_id',session.sessionId);history.replaceState(null,'',url);}
  function hidePayment(){document.querySelector('#payment-slot').hidden=true;document.querySelector('#express-checkout-slot').hidden=true;document.querySelector('#wallet-separator').hidden=true;document.querySelector('#stripe-pay').hidden=true;}

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
    mobileBar.hidden=innerWidth>700||mainBuyVisible||creating||completed||Boolean(returned||returnedCheckout)||form.hidden||!!document.querySelector('dialog[open]')||keyboard;
  }
  function update(){
    const q=quote([...selected],baseId,atlasSelected,voucherCode,giftSelected);
    document.querySelectorAll('[name="book"]:not(:disabled)').forEach(input=>input.checked=selected.has(input.value));
    document.querySelector('[name="atlas"]').checked=q.atlasIncluded;
    document.querySelector('.gift-row').hidden=!q.atlasIncluded;
    const atlasDiscount=document.querySelector('#summary-atlas-discount');
    const atlasSaving=q.atlasIncluded?product(offer.atlasId).priceCents:0;
    atlasDiscount.hidden=!q.atlasIncluded;atlasDiscount.querySelector('strong').textContent='−'+money(atlasSaving);
    if(isGame)document.querySelector('#select-bundle').checked=q.books.length===2;
    document.querySelector('#summary-books').innerHTML=isGame&&q.books.length===2?`<div class="summary-row"><span>Obe ilustrované knihy</span><strong>${money(q.booksCents-q.bundleDiscountCents)}</strong></div>`:q.books.map(id=>`<div class="summary-row"><span>${product(id).name}</span><strong>${money(product(id).priceCents)}</strong></div>`).join('');
    const giftRow=document.querySelector('#summary-additional-game');giftRow.hidden=!q.giftGame;giftRow.querySelector('strong').textContent=money(q.giftCents);
    const giftDiscount=document.querySelector('#summary-gift-discount');giftDiscount.hidden=!q.giftGame;giftDiscount.querySelector('strong').textContent='−'+money(standardGameCents-offer.additionalGameCents);
    if(isGame)document.querySelector('#addon-gift-game').checked=q.giftGame;
    document.querySelector('#email-note').textContent=isGame?'Po zaplatení vám e-mailom príde prístup k hre a zakúpeným doplnkom.'+(q.giftGame?' Dostanete aj samostatný prístup na darovanie.':''):'Po zaplatení vám e-mailom príde prístup k zakúpeným knihám.';
    const discount=document.querySelector('#summary-discount');
    discount.hidden=q.bundleDiscountCents===0;
    discount.innerHTML=q.bundleDiscountCents?`<span>Zľava na balík kníh</span><strong>−${money(q.bundleDiscountCents)}</strong>`:'';
    const standardTotal=(isGame?standardGameCents:product(baseId).priceCents)+q.booksCents+(q.giftGame?standardGameCents:0)+atlasSaving;
    const saving=standardTotal-(q.totalCents+q.voucherDiscountCents);
    document.querySelector('#price-calculation').hidden=saving===0;
    document.querySelector('#summary-saving').textContent=money(saving);
    const voucher=document.querySelector('#summary-voucher');
    voucher.hidden=!q.voucher;
    voucher.innerHTML=q.voucher?`<span>Voucher ${q.voucher} · ${q.voucher==='1e'?'nákup za 1 €':'zľava 100 %'}</span><strong>−${money(q.voucherDiscountCents)}</strong>`:'';
    voucherOpen.textContent=q.voucher?'Zľavový kód je uplatnený':'Mám zľavový kód';
    document.querySelector('#order-total').textContent=money(q.totalCents);
    document.querySelector('#summary-saving-label').textContent=isGame&&!q.books.length&&!q.giftGame&&!q.atlasIncluded?'Zvýhodnenie pri Early Access:':'Zvýhodnenie oproti štandardným cenám:';
    if(returnedSummary)document.querySelector('#order-total').textContent=money(returnedSummary.totalCents);
    document.querySelector('.checkout-buy').disabled=!configuration?.enabled||creating||completed;
    document.querySelector('.checkout-buy').firstChild.textContent=q.totalCents===0?'Pokračovať zdarma ':'Pokračovať k platbe ';
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
  function loadStripe(){
    if(window.Stripe)return Promise.resolve();
    if(stripeLoading)return stripeLoading;
    stripeLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://js.stripe.com/endive/stripe.js';
      const fail=()=>{clearTimeout(timer);script.remove();stripeLoading=null;reject(Error('Platobný formulár sa nepodarilo načítať. Skontrolujte pripojenie a skúste to znova.'));};
      const timer=setTimeout(fail,15000);
      script.onload=()=>{clearTimeout(timer);if(window.Stripe)resolve();else fail();};script.onerror=fail;document.head.append(script);
    });return stripeLoading;
  }
  function paymentMessage(message,tone='info'){const target=document.querySelector('#payment-status');target.dataset.tone=tone;target.setAttribute('role',tone==='error'?'alert':'status');target.textContent=message;}
  function forgetSavedPurchase(){try{const saved=JSON.parse(localStorage.getItem(purchaseStorage));if(saved?.attemptKey===purchase?.attemptKey)localStorage.removeItem(purchaseStorage);}catch{}}
  function freshOrder(){
    embedded?.destroy();embedded=null;forgetSavedPurchase();purchase=null;returned=null;returnedCheckout=null;returnedSummary=null;creating=false;completed=false;
    history.replaceState(null,'',location.pathname+(isGame?'':'?product='+baseId));
    form.classList.remove('payment-open','bank-return');panel.hidden=true;
    document.querySelector('.summary-total').hidden=false;document.querySelector('#returned-order-items').hidden=true;
    document.querySelector('#change-order').hidden=false;document.querySelector('#change-order').disabled=false;
    document.querySelector('#payment-status').textContent='';document.querySelector('#payment-note').textContent='Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.';
    lockOrder(false);update();
  }
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
    if(purchase){purchase.summary=summary;persistPurchase();}
    try{sessionStorage.setItem('pixelkovia-checkout-summary',JSON.stringify(summary));}catch{}
  }
  async function paymentStatus(sessionId=returned||purchase?.sessionId,{freshVisit=false}={}){
    if(checking)return;
    checking=true;creating=true;form.classList.add('payment-open');panel.hidden=false;lockOrder(true);update();
    const check=document.querySelector('#check-payment'),retry=document.querySelector('#retry-payment'),next=document.querySelector('#new-order'),change=document.querySelector('#change-order');
    if(!embedded?.inFlight){hidePayment();document.querySelector('.payment-method-note').hidden=true;}
    change.disabled=true;check.hidden=false;check.disabled=true;retry.hidden=true;next.hidden=true;
    paymentMessage(pendingMessage);
    try{
      for(let i=0;i<6;i++){
        let value;
        try{value=await api('/api/checkout/status?'+(sessionId?'session_id='+encodeURIComponent(sessionId):'checkout_id='+encodeURIComponent(returnedCheckout)));}
        catch(error){diagnostic('status_error');paymentMessage(error.status&&error.status<500?'Platobnú reláciu sa nepodarilo nájsť. Ak ste platili, platbu neopakujte a napíšte nám na miky@pixelkovia.rodulab.com.':'Spojenie sa prerušilo a výsledok platby sa nepodarilo overiť. Prosíme, neplaťte znova. Po obnovení spojenia overte stav pôvodnej platby.','error');return;}
        if(value.sessionId){sessionId=value.sessionId;returned=value.sessionId;if(purchase&&purchase.sessionId!==sessionId)purchase=null;}
        if(value.labels&&(form.classList.contains('bank-return')||!purchase))showSummary(value);
        if(value.paid){
          if(freshVisit&&!embedded?.inFlight){freshOrder();return;}
          completed=true;update();document.querySelector('#payment-heading').textContent='Ďakujeme za objednávku';
          const confirmed=value.noPaymentRequired?'✓ Objednávka s voucherom je potvrdená.':'✓ Platba je potvrdená.';
          paymentMessage(confirmed+(value.orderCount===2?(value.delivered?' Dva e-maily s rôznymi heslami sme odovzdali na odoslanie. Druhý je pre ďalšiu rodinu.':' Pripravujeme dva samostatné e-maily s rôznymi heslami. Druhý môžete preposlať ďalšej rodine.'):(value.delivered?' E-mail s prístupom sme odovzdali na odoslanie. Skontrolujte aj priečinok Spam.':' Prístupový e-mail pre vás pripravujeme. Platbu už neopakujte.')),'success');
          if(purchase){forgetSavedPurchase();purchase.phase='paid';}
          if(!embedded?.inFlight)hidePayment();
          change.hidden=true;check.hidden=value.delivered;next.hidden=!!embedded?.inFlight;return;
        }
        if((value.state==='ready'||value.state==='failed')&&!embedded?.inFlight){
          const failed=value.state==='failed';check.hidden=true;change.hidden=false;change.disabled=false;
          const message=failed?'Platbu banka nepotvrdila. Skontrolujte údaje alebo skúste inú kartu.':'Objednávka čaká na platbu. Môžete pokračovať v tom istom formulári.';
          if(embedded?.sessionId===sessionId){embedded.retry(message,failed?'error':'info');return;}
          if(freshVisit&&purchase?.input){checking=false;try{await preparePayment(purchase.input);}catch(error){handlePrepareError(error);}return;}
          paymentMessage(message,failed?'error':'info');retry.textContent='Pokračovať v pôvodnej platbe';retry.hidden=!purchase?.input;
          if(!purchase?.input){change.hidden=true;paymentMessage('Otvorte pôvodnú objednávku v tom istom prehliadači. Ak ste platbu nepotvrdili, po vypršaní relácie môžete začať znova. Pomôžeme vám na miky@pixelkovia.rodulab.com.','error');}
          return;
        }
        if(value.state==='expired'){
          paymentMessage('Čas na dokončenie platby vypršal bez úhrady. Vráťte sa k objednávke a môžete bezpečne pokračovať novou platbou.','error');check.hidden=true;change.hidden=false;change.disabled=false;return;
        }
        if(value.state==='refunded'){paymentMessage('Platba bola vrátená. Prístup k tejto objednávke je zrušený.');check.hidden=true;next.hidden=false;return;}
        if(value.state==='unknown'){paymentMessage('Objednávku sa nepodarilo nájsť. Ak ste už platili, platbu neopakujte a napíšte nám na miky@pixelkovia.rodulab.com.','error');return;}
        if(i<5)await new Promise(resolve=>setTimeout(resolve,1500));
      }
      paymentMessage(pendingMessage+' Stav môžete znova overiť tlačidlom nižšie.');
    }finally{checking=false;check.disabled=false;}
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
    let alive=true,confirming=false,inFlight=false,walletAvailable=false,cardReady=session.totalCents===0,priceValid=true,payment,wallet;
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
      try{displayTotal(current);priceValid=true;syncPayButton();}catch(error){priceValid=false;syncPayButton();paymentMessage(error.message,'error');}
    });
    function readyForRetry(message,tone='error'){
      confirming=false;if(purchase){purchase.phase='ready';persistPurchase();}
      document.querySelector('#payment-slot').hidden=false;pay.hidden=false;walletSlot.hidden=!walletAvailable;separator.hidden=!walletAvailable;
      document.querySelector('.payment-method-note').hidden=session.totalCents===0;
      document.querySelector('#check-payment').hidden=true;document.querySelector('#retry-payment').hidden=true;
      change.hidden=false;change.disabled=false;syncPayButton();paymentMessage(message,tone);
    }
    async function confirm(event){
      if(!alive||confirming||checking||purchase?.phase==='unknown'||purchase?.phase==='paid')return;
      try{displayTotal(loaded.actions.getSession());}catch(error){paymentMessage(error.message,'error');event?.paymentFailed?.({reason:'fail',message:error.message});return;}
      confirming=true;pay.disabled=true;change.disabled=true;
      // Stripe's Checkout API reports validation separately from confirmation errors.
      // Do this before recording any attempt to charge; invalid fields stay visible.
      if(!event&&session.totalCents>0){
        try{
          const validation=await loaded.actions.validateElements();
          if(!alive)return;
          if(validation.type==='error'){diagnostic('validation_error','card');readyForRetry(validation.error.validation_errors?.[0]?.message||validation.error.message||'Skontrolujte údaje karty označené vo formulári.');return;}
        }catch{diagnostic('validation_connection_error','card');if(alive)readyForRetry('Údaje karty sa nepodarilo overiť. Skontrolujte pripojenie a skúste to znova.');return;}
      }
      if(!alive)return;
      const method=event?({apple_pay:'apple_pay',google_pay:'google_pay'}[event.expressPaymentType]||'wallet'):session.totalCents===0?'free':'card';
      diagnostic('confirm_started',method);
      inFlight=true;if(purchase){purchase.phase='confirming';persistPurchase();}
      paymentMessage(session.totalCents===0?'Potvrdzujem objednávku…':'Spracúvam platbu…');
      // A slow bank dialog must keep its original Stripe elements and confirmation alive.
      const watchdog=setTimeout(()=>{if(alive&&inFlight){diagnostic('confirmation_timeout',method);if(purchase){purchase.phase='unknown';persistPurchase();}paymentMessage(pendingMessage);document.querySelector('#check-payment').hidden=false;}},20000);
      let outcome;
      try{
        // return_url is owned by the server. Supplying returnUrl here throws before charging.
        outcome=await loaded.actions.confirm({redirect:'if_required',...(event?{expressCheckoutConfirmEvent:event}:{})});
      }catch{diagnostic('confirm_error',method);outcome=null;}
      finally{clearTimeout(watchdog);inFlight=false;}
      if(!alive)return;
      if(outcome?.type==='error'&&outcome.error?.code==='paymentFailed'&&!completed){
        diagnostic('payment_failed_client',method);
        const message=outcome.error.message||'Platbu banka nepotvrdila. Skúste inú kartu.';
        event?.paymentFailed?.({reason:'fail',message});
        // Wait for the native callback to return before restoring or polling the page.
        setTimeout(()=>{if(alive){if(checking){setTimeout(()=>{if(alive)void paymentStatus(session.sessionId);},1600);}else readyForRetry(message);}},0);
        return;
      }
      if(outcome?.type==='error'&&outcome.error?.code!=='paymentFailed')diagnostic('confirm_error',method);
      if(purchase){purchase.phase=completed?'paid':'unknown';if(!completed)persistPurchase();}
      // Unclassified errors require Stripe verification, never a new payment by assumption.
      setTimeout(()=>{if(alive)void paymentStatus(session.sessionId);},0);
    }
    const submit=()=>confirm();
    const destroy=()=>{alive=false;pay.removeEventListener('click',submit);payment?.destroy();wallet?.destroy();pay.hidden=true;pay.disabled=true;walletSlot.hidden=true;separator.hidden=true;};
    document.querySelector('#payment-heading').textContent=session.totalCents===0?'Potvrdenie objednávky zdarma':'Bezpečná platba';
    document.querySelector('.payment-method-note').hidden=session.totalCents===0;
    form.classList.add('payment-open');panel.hidden=false;document.querySelector('#payment-slot').hidden=false;walletSlot.hidden=false;separator.hidden=true;pay.hidden=false;pay.disabled=true;document.querySelector('#check-payment').hidden=true;document.querySelector('#retry-payment').hidden=true;document.querySelector('#new-order').hidden=true;
    try{
      if(session.totalCents>0){
        payment=checkout.createPaymentElement({layout:'tabs',fields:{billingDetails:{email:'never',phone:'never'}},wallets:{applePay:'never',googlePay:'never',link:'never'}});
        payment.on('ready',()=>{if(alive){cardReady=true;syncPayButton();}});
        payment.on('loaderror',()=>{if(alive){diagnostic('element_error','card');cardReady=false;syncPayButton();paymentMessage('Údaje karty sa nepodarilo načítať. Skontrolujte pripojenie a obnovte pôvodný formulár.','error');document.querySelector('#retry-payment').hidden=false;}});
        if(configuration.wallets?.applePay||configuration.wallets?.googlePay){
          wallet=checkout.createExpressCheckoutElement({buttonHeight:44,layout:{maxColumns:2,maxRows:1},paymentMethods:{applePay:configuration.wallets?.applePay?'always':'never',googlePay:configuration.wallets?.googlePay?'always':'never',link:'never',paypal:'never',amazonPay:'never',klarna:'never'}});
          const showWallets=available=>{if(available&&!walletAvailable)diagnostic('wallet_available','wallet');walletAvailable=available;if(alive&&!confirming&&!checking&&!completed){walletSlot.hidden=!available;separator.hidden=!available;}};
          wallet.on('ready',event=>showWallets(Boolean(event.availablePaymentMethods?.applePay||event.availablePaymentMethods?.googlePay)));
          // Availability can change after ready while Stripe checks the browser's wallets.
          wallet.on('availablepaymentmethodschange',event=>showWallets(Boolean(event.paymentMethods?.applePay?.available||event.paymentMethods?.googlePay?.available)));
          wallet.on('confirm',confirm);
          wallet.on('cancel',()=>{diagnostic('wallet_cancelled','wallet');if(alive&&!confirming)paymentMessage('Peňaženku ste zatvorili. Platbu ste nepotvrdili.');});
          wallet.on('loaderror',()=>{diagnostic('wallet_error','wallet');showWallets(false);});
          wallet.mount('#express-checkout-slot');
        }else{walletSlot.hidden=true;}
        payment.mount('#payment-slot');
      }else{walletSlot.hidden=true;pay.disabled=false;}
      pay.addEventListener('click',submit);
      return {destroy,sessionId:session.sessionId,get inFlight(){return inFlight;},retry:readyForRetry};
    }catch(error){destroy();throw error;}
  }
  async function preparePayment(input,{freshVisit=false}={}){
    if(preparing)return;
    preparing=true;let stage='session_error';
    try{
      await configurationPromise;if(!configuration?.enabled)throw Error('Platby sa teraz nepodarilo načítať. Skúste to znova.');
      let session=await post('/api/checkout/session',input);
      trackSession(session);rememberSummary(session);
      if(session.state==='paid'||session.state==='expired'){preparing=false;void paymentStatus(session.sessionId,{freshVisit});return;}
      if(input.uiMode!=='elements'){
        // Retire only this buyer's verified, unpaid old hosted/form session.
        await post('/api/checkout/release',{attemptKey:purchase.attemptKey});
        input={...input,uiMode:'elements',attemptKey:crypto.randomUUID()};purchase={attemptKey:input.attemptKey,input,phase:'creating'};persistPurchase();
        session=await post('/api/checkout/session',input);trackSession(session);rememberSummary(session);
      }
      if(!session.clientSecret)throw Error('Platobný formulár sa nepodarilo obnoviť. Skúste to znova.');
      stage='sdk_error';await loadStripe();paymentMessage('');embedded?.destroy();embedded=await mountPayment(session);
      document.querySelector('#change-order').hidden=false;document.querySelector('#change-order').disabled=false;
      if(purchase){purchase.phase='ready';persistPurchase();}
      panel.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#payment-note').textContent='Objednávku dokončite v zabezpečenom formulári nižšie.';
    }catch(error){if(!error.status||error.status>=500)diagnostic(stage);throw error;}finally{preparing=false;}
  }
  const emailInput=form.elements.email,emailError=document.querySelector('#email-error');
  function validateEmail(){
    emailInput.value=emailInput.value.trim();const valid=emailInput.validity.valid&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    emailError.hidden=valid;emailInput.setAttribute('aria-invalid',String(!valid));
    if(!valid){emailError.textContent=emailInput.value?'Skontrolujte e-mail, napríklad meno@domena.sk. Sem vám pošleme prístup.':'Zadajte e-mail, na ktorý vám pošleme dobrodružstvo.';emailInput.focus();}return valid;
  }
  emailInput.addEventListener('input',()=>{emailError.hidden=true;emailInput.removeAttribute('aria-invalid');});
  buy.addEventListener('click',async()=>{
    if(!configuration?.enabled||creating||completed||!validateEmail())return;
    creating=true;lockOrder(true);update();document.querySelector('#payment-note').textContent='Pripravujem zabezpečený formulár…';
    const input={baseId,books:[...selected],atlasIncluded:atlasSelected,voucherCode,giftGame:giftSelected,uiMode:'elements',email:form.elements.email.value.trim(),attemptKey:crypto.randomUUID()};
    purchase={attemptKey:input.attemptKey,input,phase:'creating'};persistPurchase();
    try{await preparePayment(input);}catch(error){handlePrepareError(error);}
  });
  function handlePrepareError(error){
    if(embedded?.inFlight)return;
    embedded?.destroy();embedded=null;creating=true;
    panel.hidden=false;form.classList.add('payment-open');lockOrder(true);update();hidePayment();
    document.querySelector('#check-payment').hidden=!purchase?.sessionId;
    document.querySelector('#retry-payment').hidden=false;document.querySelector('#retry-payment').textContent='Obnoviť pôvodný formulár';
    document.querySelector('#new-order').hidden=true;document.querySelector('#change-order').hidden=false;document.querySelector('#change-order').disabled=false;
    paymentMessage(error.status&&error.status<500?error.message:'Formulár sa nepodarilo načítať. Skontrolujte spojenie a obnovte pôvodnú objednávku. Týmto krokom platbu nepotvrdzujete.','error');
  }
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
  async function resetOrder(){
    if(checking||preparing||embedded?.inFlight)return;
    const change=document.querySelector('#change-order');change.disabled=true;
    try{
      if(purchase)await post('/api/checkout/release',{attemptKey:purchase.attemptKey});
      else if(returned){const value=await api('/api/checkout/status?session_id='+encodeURIComponent(returned));if(!value.paid&&!['expired','refunded'].includes(value.state))throw Error(pendingMessage);}
      freshOrder();form.scrollIntoView({behavior:'smooth',block:'start'});
    }catch{diagnostic('release_error');paymentMessage('Pôvodnú platbu sa zatiaľ nepodarilo bezpečne uzavrieť. Prosíme, neplaťte znova. Overte stav pôvodnej platby.','error');document.querySelector('#check-payment').hidden=!purchase?.sessionId;document.querySelector('#retry-payment').hidden=!!purchase?.sessionId;}
    finally{change.disabled=false;}
  }
  document.querySelector('#change-order').addEventListener('click',()=>void resetOrder());
  document.querySelector('#new-order').addEventListener('click',()=>void resetOrder());
  document.querySelector('#check-payment').addEventListener('click',()=>void paymentStatus());
  document.querySelector('#retry-payment').addEventListener('click',async()=>{
    if(!purchase?.input||checking||preparing||embedded?.inFlight)return;
    document.querySelector('#retry-payment').hidden=true;
    try{await preparePayment(purchase.input);}catch(error){handlePrepareError(error);}
  });
  window.addEventListener('storage',event=>{
    if(event.key!==purchaseStorage||!event.newValue||preparing||checking)return;
    // An open checkout keeps its own original attempt even when another tab buys again.
    if(returned||returnedCheckout){if(!embedded?.inFlight)void paymentStatus();return;}
    try{const value=JSON.parse(event.newValue);if(value?.sessionId){purchase=value;void paymentStatus(value.sessionId);}}catch{}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted&&(returned||returnedCheckout||purchase?.sessionId)&&!embedded?.inFlight)void paymentStatus();});
  configurationPromise=api('/api/checkout/config').then(value=>{configuration=value;document.querySelector('#payment-note').textContent=value.enabled?'Bezpečná platba kartou priamo tu. Prístup dostanete automaticky e-mailom.':'Platby teraz nie sú dostupné. Skúste to o chvíľu alebo nám napíšte na miky@pixelkovia.rodulab.com.';update();}).catch(()=>{diagnostic('config_error');document.querySelector('#payment-note').textContent='Platobnú službu sa nepodarilo načítať. Skontrolujte spojenie a obnovte stránku.';});
  if(purchase?.input){const input=purchase.input;form.elements.email.value=input.email;if(input.baseId===baseId){atlasSelected=input.atlasIncluded;giftSelected=!!input.giftGame;voucherCode=input.voucherCode;input.books.forEach(id=>selected.add(id));}}
  update();
  const recovering=returned||returnedCheckout||purchase?.sessionId;
  if(purchase&&!recovering){creating=true;lockOrder(true);update();void preparePayment(purchase.input,{freshVisit:true}).catch(handlePrepareError);}
  if(recovering){
    const freshVisit=!params.has('session_id')&&!params.has('checkout_id');
    if(!freshVisit){form.classList.add('bank-return');showSummary(purchase?.summary);}
    void paymentStatus(returned||purchase?.sessionId,{freshVisit});
  }
})();
