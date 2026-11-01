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
  let configuration,creating=false,completed=false,checking=false,allowNewPurchase=false,preparing=false,resumeUrl=null;
  function persistPurchase(){try{if(purchase)localStorage.setItem(purchaseStorage,JSON.stringify(purchase));else localStorage.removeItem(purchaseStorage);}catch{}}
  async function api(url,options={}){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000),...options});const data=await response.json();if(!response.ok){const error=Error(data.error||pendingMessage);error.status=response.status;error.code=data.code;throw error;}return data;}
  const post=(url,input)=>api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  function trackSession(session){purchase.sessionId=session.sessionId;returned=session.sessionId;returnedCheckout=null;persistPurchase();const url=new URL(location.href);url.searchParams.delete('checkout_id');url.searchParams.delete('canceled');url.searchParams.set('session_id',session.sessionId);history.replaceState(null,'',url);}

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
  const note=document.querySelector('#payment-note'),status=document.querySelector('#payment-status');
  const change=document.querySelector('#change-order'),check=document.querySelector('#check-payment');
  const retry=document.querySelector('#retry-payment'),next=document.querySelector('#new-order');
  const continueLink=document.querySelector('#continue-payment'),portal=document.querySelector('#open-portal');
  const reload=document.querySelector('#reload-payments'),emailInput=form.elements.email,emailError=document.querySelector('#email-error');
  function notice(tone,title,message){
    status.dataset.tone=tone;status.setAttribute('role',tone==='error'?'alert':'status');
    status.replaceChildren();const heading=document.createElement('strong'),text=document.createElement('span');
    heading.textContent=title;text.textContent=message;status.append(heading,text);status.hidden=false;
  }
  function lockOrder(locked){form.querySelectorAll('input,button').forEach(i=>{if(!panel.contains(i))i.disabled=locked;});if(!locked)document.querySelector(`[name="book"][value="${baseId}"]`)?.setAttribute('disabled','');}
  function actions(){check.hidden=true;retry.hidden=true;next.hidden=true;continueLink.hidden=true;continueLink.removeAttribute('href');portal.hidden=true;reload.hidden=true;change.hidden=true;resumeUrl=null;}
  function paymentView(){form.classList.add('payment-open');panel.hidden=false;creating=true;lockOrder(true);update();}
  function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='checkout.stripe.com'&&!url.username&&!url.password&&!url.port&&url.pathname.startsWith('/c/pay/')?url.href:null;}catch{return null;}}
  function showSummary(summary){
    const valid=summary&&Array.isArray(summary.labels)&&summary.labels.length<=5&&summary.labels.every(s=>typeof s==='string'&&s.length<160)&&Number.isInteger(summary.totalCents)&&summary.totalCents>=0;
    returnedSummary=valid?summary:null;
    document.querySelector('#returned-order-items').hidden=!valid;
    document.querySelector('.summary-total').hidden=!valid;
    if(valid){document.querySelector('#returned-order-items').textContent=summary.labels.join(' · ');document.querySelector('#order-total').textContent=money(summary.totalCents);}
  }
  function rememberSummary(session){
    const labels=[baseId,...selected,...(atlasSelected?[offer.atlasId]:[])].map(id=>product(id).name);
    if(giftSelected)labels.push('Druhá hra pre ďalšiu rodinu');
    const summary={sessionId:session.sessionId,labels,totalCents:session.totalCents,at:Date.now()};
    if(purchase){purchase.summary=summary;persistPurchase();}
    try{sessionStorage.setItem('pixelkovia-checkout-summary',JSON.stringify(summary));}catch{}
  }
  function continueAt(value){
    resumeUrl=safeUrl(value);if(!resumeUrl)return false;
    continueLink.href=resumeUrl;continueLink.hidden=false;return true;
  }
  function verifyButton(){check.hidden=false;check.disabled=checking;}
  async function paymentStatus(sessionId=returned||purchase?.sessionId){
    if(checking||preparing)return;
    checking=true;paymentView();actions();check.hidden=false;check.disabled=true;
    notice('info','Overujeme výsledok platby',pendingMessage);
    document.querySelector('#payment-heading').textContent='Vaša platba';
    try{
      for(let i=0;i<6;i++){
        let value;
        try{value=await api('/api/checkout/status?'+(sessionId?'session_id='+encodeURIComponent(sessionId):'checkout_id='+encodeURIComponent(returnedCheckout)));}
        catch(error){
          if(error.status&&error.status<500){notice('error','Platbu sa nepodarilo nájsť','Skontrolujte odkaz, ktorým ste sa vrátili. Ak ste platili, pozrite si e-mail alebo nám napíšte na miky@pixelkovia.rodulab.com.');return;}
          notice('error','Spojenie sa prerušilo','Výsledok platby sa teraz nepodarilo overiť. Prosíme, neplaťte znova. Po obnovení spojenia použite „Overiť stav platby“.');return;
        }
        // Prices and the return summary come from a verified server Session.
        if(value.sessionId){if(purchase&&purchase.sessionId!==value.sessionId)purchase=null;returned=value.sessionId;sessionId=value.sessionId;}
        if(value.labels)showSummary(value);
        if(value.paid){
          completed=true;update();document.querySelector('#payment-heading').textContent='Dobrodružstvo je vaše';
          const two=value.orderCount===2;
          notice('success',value.noPaymentRequired?'Objednávka zdarma je potvrdená':'Platba je potvrdená',
            value.delivered?(two?'Dva e-maily s rôznymi heslami sme odovzdali na odoslanie. Druhý môžete preposlať ďalšej rodine. Skontrolujte aj priečinok Spam.':'E-mail s prístupom sme odovzdali na odoslanie. Nájdete v ňom odkaz aj heslo pre tento nákup. Skontrolujte aj priečinok Spam.'):
              (two?'Pripravujeme dva samostatné e-maily s rôznymi heslami. Platbu už neopakujte.':'Prístupový e-mail pre vás pripravujeme. Platbu už neopakujte.'));
          if(purchase&&purchase.sessionId===sessionId){purchase.phase='paid';persistPurchase();}
          check.hidden=value.delivered;next.hidden=false;portal.hidden=!value.delivered;return;
        }
        if(value.state==='refunded'){
          notice('info','Platba bola vrátená','Prístup k tejto objednávke je zrušený. Ak chcete ďalšie dobrodružstvo, vytvorte samostatnú objednávku.');check.hidden=true;next.hidden=false;return;
        }
        if(value.state==='expired'){
          notice('error','Čas na dokončenie platby vypršal','Táto platba nebola dokončená. Môžete sa vrátiť k výberu a bezpečne pokračovať novou platbou.');check.hidden=true;change.hidden=false;change.disabled=false;return;
        }
        if(value.state==='ready'||value.state==='failed'){
          const failed=value.state==='failed';
          notice(failed?'error':'info',failed?'Platba nebola dokončená':'Vaša objednávka čaká na platbu',
            failed?'Platbu môžete skúsiť znova na zabezpečenej stránke Stripe alebo použiť inú kartu. Pokračujete v tej istej objednávke.':
              value.checkoutUrl?'Pokračujte na zabezpečenej stránke Stripe. Môžete zaplatiť kartou alebo dostupnou peňaženkou. Platbu potvrdíte až tam.':'Pôvodný platobný formulár potrebuje obnoviť. Vráťte sa k výberu objednávky a pokračujte cez novú zabezpečenú platbu.');
          continueAt(value.checkoutUrl);check.hidden=true;
          change.hidden=!purchase?.attemptKey;change.disabled=false;
          if(!resumeUrl&&!purchase?.attemptKey)notice('error','Pôvodný formulár už nie je dostupný','Otvorte objednávku v pôvodnom prehliadači. Ak ste platbu nepotvrdili, po vypršaní platobnej relácie môžete začať znova. Pomôžeme vám na miky@pixelkovia.rodulab.com.');
          return;
        }
        if(value.state==='unknown'){
          notice('error','Objednávku sa nepodarilo nájsť','Ak ste už platili, platbu neopakujte. Skontrolujte e-mail alebo nám napíšte na miky@pixelkovia.rodulab.com.');return;
        }
        if(i<5)await new Promise(resolve=>setTimeout(resolve,1500));
      }
      notice('info','Čakáme na potvrdenie platby',pendingMessage+' Stav môžete znova overiť tlačidlom nižšie.');
    }finally{checking=false;check.disabled=false;}
  }
  function prepareError(error){
    paymentView();actions();
    if(error.code==='previous_payment_paid'){
      notice('success','Predchádzajúca platba je potvrdená','Prístup vám príde e-mailom. Ďalšiu samostatnú objednávku vytvorte iba vtedy, ak chcete kúpiť ďalší produkt.');next.hidden=false;return;
    }
    const invalid=error.status&&error.status<500&&error.status!==409;
    notice('error',invalid?'Objednávku treba skontrolovať':'Prípravu platby sa nepodarilo dokončiť',
      invalid?error.message:'Mohlo dôjsť k výpadku spojenia. Obnovte tú istú objednávku tlačidlom nižšie. Týmto krokom platbu nepotvrdzujete.');
    retry.hidden=false;retry.disabled=false;retry.textContent='Obnoviť tú istú objednávku';
    change.hidden=false;change.disabled=false;
    if(error.status===409){notice('error','Predchádzajúca objednávka ešte nie je uzavretá',error.message+' Ak máte otvorenú platbu v inej záložke, pokračujte tam.');}
  }
  async function preparePayment(){
    if(preparing||checking||!purchase)return;
    preparing=true;paymentView();actions();notice('info','Pripravujeme bezpečnú platbu','O chvíľu vás presmerujeme na Stripe. Objednávku zaplatíte až na jeho zabezpečenej stránke.');
    try{
      // A pre-upgrade attempt is closed by the server before creating hosted Checkout.
      if(purchase.input.uiMode!=='hosted'){
        await post('/api/checkout/release',{attemptKey:purchase.attemptKey});
        purchase={attemptKey:crypto.randomUUID(),input:{...purchase.input,uiMode:'hosted'},phase:'creating'};
        purchase.input.attemptKey=purchase.attemptKey;persistPurchase();
      }
      const session=await post('/api/checkout/session',purchase.input);
      trackSession(session);rememberSummary(session);
      if(session.state==='paid'||session.state==='expired'){preparing=false;void paymentStatus(session.sessionId);return;}
      if(!continueAt(session.checkoutUrl))throw Error('Invalid hosted checkout URL');
      purchase.phase='ready';persistPurchase();
      notice('info','Pokračujte v zabezpečenej platbe','Otvárame Stripe. Ak sa stránka neotvorí automaticky, použite tlačidlo „Pokračovať na platbu“.');
      change.hidden=false;change.disabled=false;
      location.assign(resumeUrl);
    }catch(error){prepareError(error);}
    finally{preparing=false;}
  }
  function validateEmail(){
    emailInput.value=emailInput.value.trim();
    const valid=emailInput.validity.valid&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    emailError.hidden=valid;emailInput.setAttribute('aria-invalid',String(!valid));
    if(!valid){emailError.textContent=emailInput.value?'Skontrolujte e-mail, napríklad meno@domena.sk. Sem vám pošleme prístup.':'Zadajte e-mail, na ktorý vám pošleme dobrodružstvo.';emailInput.focus();}
    return valid;
  }
  emailInput.addEventListener('input',()=>{emailError.hidden=true;emailInput.removeAttribute('aria-invalid');});
  buy.addEventListener('click',()=>{
    if(!configuration?.enabled||creating||completed||!validateEmail())return;
    const input={baseId,books:[...selected],atlasIncluded:atlasSelected,voucherCode,giftGame:giftSelected,uiMode:'hosted',email:emailInput.value,attemptKey:crypto.randomUUID(),...(allowNewPurchase?{newPurchase:true}:{})};
    purchase={attemptKey:input.attemptKey,input,phase:'creating'};persistPurchase();void preparePayment();
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
  async function resetOrder(newPurchase=false){
    if(checking||preparing)return;
    change.disabled=true;next.disabled=true;continueLink.hidden=true;
    try{
      if(purchase)await post('/api/checkout/release',{attemptKey:purchase.attemptKey});
      else if(!newPurchase&&returnedSummary&&returned) {
        // A verified expired Session is safe even when browser storage is unavailable.
        const value=await api('/api/checkout/status?session_id='+encodeURIComponent(returned));
        if(value.state!=='expired')throw Error(pendingMessage);
      }else if(!newPurchase)throw Error(pendingMessage);
      purchase=null;returned=null;returnedCheckout=null;persistPurchase();
      history.replaceState(null,'',location.pathname+(isGame?'':'?product='+baseId));
      panel.hidden=true;form.classList.remove('payment-open','bank-return');returnedSummary=null;creating=false;completed=false;allowNewPurchase=newPurchase;
      document.querySelector('.summary-total').hidden=false;document.querySelector('#returned-order-items').hidden=true;
      actions();status.replaceChildren();note.textContent=readyMessage;lockOrder(false);update();
      form.scrollIntoView({behavior:'smooth',block:'start'});emailInput.focus({preventScroll:true});
    }catch{
      notice('error','Najprv overíme pôvodnú platbu','Objednávku sa teraz nepodarilo bezpečne uzavrieť. Prosíme, neplaťte znova. Obnovte tú istú objednávku alebo overte stav pôvodnej platby.');if(returned||returnedCheckout||purchase?.sessionId)verifyButton();else{retry.hidden=false;retry.textContent='Obnoviť tú istú objednávku';}
    }finally{change.disabled=false;next.disabled=false;}
  }
  change.addEventListener('click',()=>void resetOrder());
  next.addEventListener('click',()=>void resetOrder(true));
  check.addEventListener('click',()=>void paymentStatus());
  retry.addEventListener('click',()=>void preparePayment());
  // Reusing the server-issued hosted URL never creates another payment.
  continueLink.addEventListener('click',event=>{if(!safeUrl(continueLink.href)||checking||preparing){event.preventDefault();return;}if(purchase){purchase.phase='ready';persistPurchase();}});
  window.addEventListener('storage',event=>{
    if(event.key!==purchaseStorage||preparing||checking)return;
    // A return URL always identifies its own order, even when another tab buys again.
    if(returned||returnedCheckout){void paymentStatus();return;}
    try{const value=JSON.parse(event.newValue);if(value?.sessionId){purchase=value;void paymentStatus(value.sessionId);}}catch{}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted&&(returned||returnedCheckout||purchase?.sessionId))void paymentStatus();});
  const readyMessage='Platbu dokončíte na zabezpečenej stránke Stripe. Karta, Apple Pay alebo Google Pay podľa vášho zariadenia.';
  async function loadConfiguration(){
    reload.disabled=true;
    try{
      const value=await api('/api/checkout/config');configuration=value;
      note.textContent=value.enabled?readyMessage:'Platby teraz nie sú dostupné. Skúste to o chvíľu alebo nám napíšte na miky@pixelkovia.rodulab.com.';
      if(!value.enabled)throw Error('disabled');
      reload.hidden=true;if(!purchase&&!returned&&!returnedCheckout){panel.hidden=true;form.classList.remove('payment-open');creating=false;lockOrder(false);}
    }catch{
      configuration={enabled:false};
      if(!returned&&!returnedCheckout&&!purchase){panel.hidden=false;notice('error','Platby sa teraz nepodarilo načítať','Skontrolujte pripojenie a skúste načítanie znova. Vašu kartu sme nezaťažili.');reload.hidden=false;}
    }finally{reload.disabled=false;update();}
  }
  reload.addEventListener('click',()=>void loadConfiguration());
  // Local data restores presentation only. Stripe and the server decide payment status.
  if(purchase?.input){const input=purchase.input;emailInput.value=input.email;atlasSelected=input.atlasIncluded;giftSelected=!!input.giftGame;voucherCode=input.voucherCode;input.books.forEach(id=>selected.add(id));}
  // Never let an unrelated cached purchase overwrite the order in a return link.
  if(returned&&purchase?.sessionId!==returned)purchase=null;
  update();void loadConfiguration();
  const recovering=returned||returnedCheckout||purchase?.sessionId;
  if(purchase&&!recovering)prepareError(Error(pendingMessage));
  if(recovering){
    form.classList.add('bank-return');showSummary(purchase?.summary);void paymentStatus(returned||purchase?.sessionId);
  }
})();
