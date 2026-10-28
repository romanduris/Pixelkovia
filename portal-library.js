/* Customer library: ownership is read from the authenticated API, never browser storage. */
(() => {
  'use strict';
  const books=window.PIXELKOVIA_LIBRARY;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=path=>new URL('/api/customer/library'+path,SITE_CONFIG.managementUrl()).href;
  const readUrl=id=>'/kniznica/citat?book='+encodeURIComponent(id);
  const offer=book=>`<a class="btn" href="checkout.html?product=${book.id}">Kúpiť knihu · ${SITE_CONFIG.money(SITE_CONFIG.product(book.id).priceCents)} →</a>${PIXELKOVIA_BOOK_PREVIEWS.button(book.id)}`;
  const card=book=>`<article class="library-card" data-library-book="${book.id}">${PIXELKOVIA_BOOK_PREVIEWS.cover(book)}<div><p class="section-kicker">${esc(book.subtitle)}</p><h3>${esc(book.title)}</h3><p>${esc(book.description)}</p><p class="library-reading-time">${esc(book.readingTime)} · tri uzavreté rozprávky</p><p class="library-ownership" data-library-ownership>Overujem prístup ku knihe…</p><div class="library-actions" data-library-actions></div></div></article>`;
  function render(){return `<section class="portal-section portal-library" id="kniznica" aria-labelledby="library-heading"><span class="section-kicker">VAŠA KNIŽNICA</span><h2 id="library-heading">Príbehy na spoločné<br><em>čítanie.</em></h2><p>Zakúpené knihy otvoríte jedným kliknutím. Ďalšie príbehy si môžete najprv prezrieť.</p><p class="library-status" role="status" data-library-status>Načítavam vašu knižnicu…</p><div class="library-cards">${books.map(card).join('')}</div><article class="library-atlas"><img src="assets/atlas/guardy.webp" width="110" height="110" alt="Guardy" loading="lazy"><div><span class="section-kicker">ZDARMA PRE VÁS</span><h3>Atlas Pixelkov</h3><p>Spoznajte všetkých sedem kamarátov, ich schopnosti a malé objavy.</p><a class="btn secondary" href="atlas.html">Otvoriť Atlas →</a></div></article></section>`;}
  let request;
  async function mount(){
    request?.abort();const root=document.querySelector('#kniznica');if(!root)return;
    const controller=new AbortController();request=controller;
    const status=root.querySelector('[data-library-status]');let access=new Set();
    try{
      const response=await fetch(api(''),{credentials:'include',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Object.assign(new Error('access'),{status:response.status});
      const result=await response.json();
      if(!Array.isArray(result.books)||result.books.some(b=>!books.some(book=>book.id===b.id)||typeof b.owned!=='boolean'))throw Error('invalid library');
      access=new Set(result.books.filter(b=>b.owned).map(b=>b.id));
      status.textContent=access.size?`${access.size===1?'Máte zakúpenú 1 knihu.':'Máte zakúpené '+access.size+' knihy.'} Prajeme príjemné spoločné čítanie.`:'Vyberte si svoj prvý príbeh. Atlas si môžete otvoriť zdarma.';
    }catch(error){
      if(controller.signal.aborted)return;
      status.textContent=error.status===501?'Overovanie nákupov je dočasne nedostupné. Skúste to neskôr.':error.status===401?'Na otvorenie zakúpených kníh je potrebné prihlásenie do rodičovského portálu.':'Nákupy sa nepodarilo overiť. Skúste to znova; zatiaľ si môžete pozrieť ukážky.';
      if(![401,501].includes(error.status)){const retry=document.createElement('button');retry.type='button';retry.className='text-link';retry.textContent='Skúsiť znova';retry.addEventListener('click',mount,{once:true});status.append(' ',retry);}
    }
    if(controller.signal.aborted||!root.isConnected)return;
    for(const book of books){
      const row=root.querySelector(`[data-library-book="${book.id}"]`),owned=access.has(book.id);
      row.classList.toggle('is-owned',owned);
      row.querySelector('[data-library-ownership]').textContent=owned?'✓ Vo vašej knižnici':'Zatiaľ nezakúpené · dostupná je ukážka';
      row.querySelector('[data-library-actions]').innerHTML=owned?`<a class="btn" href="${readUrl(book.id)}">Čítať knihu →</a>`:offer(book);
    }
  }
  let readingRequest;
  async function reader(){
    const root=document.querySelector('[data-library-reader]');if(!root)return;
    readingRequest?.abort();const controller=new AbortController();readingRequest=controller;
    const book=books.find(b=>b.id===new URLSearchParams(location.search).get('book'));
    if(!book){root.textContent='Táto kniha sa v knižnici nenachádza.';return;}
    document.title=book.title+' — Vaša knižnica';
    try{
      const response=await fetch(window.PIXELKOVIA_ADMIN?'/api/admin/library/'+book.id:api('/'+book.id),{credentials:'include',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Object.assign(new Error('access'),{status:response.status});
      const content=await response.json();
      if(content.id!==book.id||!Array.isArray(content.stories)||content.stories.length!==3)throw Error('invalid book');
      if(controller.signal.aborted)return;
      const prose=paragraphs=>paragraphs.map(p=>`<p>${esc(p)}</p>`).join('');
      root.innerHTML=`<section class="book-intro">${PIXELKOVIA_BOOK_PREVIEWS.cover(book)}<div><p class="eyebrow">${esc(content.subtitle)}</p><h1 tabindex="-1">${esc(content.title)}</h1><p>${esc(book.readingTime)}</p><a href="/Supervisor#kniznica">← Späť do vašej knižnice</a></div></section><section class="reading-surface"><h2>Pred spoločným čítaním</h2>${prose(content.intro)}<nav class="story-index" aria-label="Obsah knihy">${content.stories.map(s=>`<a href="#${esc(s.id)}">${esc(s.title)}</a>`).join('')}</nav></section>${content.stories.map(s=>`<article class="reading-surface book-story" id="${esc(s.id)}"><header><h2>${esc(s.title)}</h2><p class="story-subtitle">${esc(s.subtitle)}</p><small>Približne ${Number(s.readingMinutes)} min čítania</small></header><figure><img src="assets/books/${book.key}-${content.stories.indexOf(s)+1}.webp" alt="${esc(s.subtitle)}" width="1200" height="800" loading="lazy"></figure><div class="authored-prose">${prose(s.paragraphs)}</div><footer><a href="#reading">Späť na obsah knihy ↑</a><a href="/Supervisor#kniznica">Späť do knižnice →</a></footer></article>`).join('')}`;
    }catch(error){
      if(controller.signal.aborted)return;
      root.innerHTML=`<section class="reading-surface"><h1>Knihu zatiaľ nemôžeme otvoriť</h1><p role="status">${error.status===403?'Táto kniha nie je súčasťou vašich platných nákupov.':error.status===401?'Prihláste sa do rodičovského portálu a otvorte knihu znova.':error.status===501?'Zákaznícke prihlasovanie zatiaľ nie je pripojené.':'Prístup ku knihe sa nepodarilo overiť. Skúste to znova.'}</p>${![401,403,501].includes(error.status)?'<p><button class="theme-toggle" type="button" data-retry-reading>Skúsiť znova</button></p>':''}<a href="/Supervisor#kniznica">← Späť do vašej knižnice</a></section>`;
      root.querySelector('[data-retry-reading]')?.addEventListener('click',reader,{once:true});
    }
  }
  window.PORTAL_LIBRARY={render,mount};
  if(document.querySelector('[data-library-reader]'))reader();
  // Recheck ownership after returning from checkout or a different browser tab.
  window.addEventListener('pageshow',event=>{if(event.persisted){mount();reader();}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){mount();if(document.querySelector('[data-library-reader]'))reader();}});
})();
