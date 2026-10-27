/* Only public metadata and approved short preview images. No paid prose or game state. */
(() => {
  'use strict';
  const books=window.PIXELKOVIA_LIBRARY;
  const cover=book=>`<div class="offer-book-cover"><img src="${book.cover}" width="280" height="400" alt="Ilustrácia obálky knihy ${book.title}" loading="lazy"><span><small>TAJNÝ SVET PIXELKOV</small><strong>${book.title}</strong></span></div>`;
  const button=(id,label='Pozrieť ukážku')=>`<button type="button" class="book-preview-button" data-book-preview="${id}" aria-haspopup="dialog" aria-controls="book-preview-dialog">${label} <span aria-hidden="true">↗</span></button>`;
  const card=(book,price)=>`<article class="funnel-book-card">${cover(book)}<div><span class="funnel-kicker">${book.key==='before'?'PRED DOBRODRUŽSTVOM':'PO DOBRODRUŽSTVE'}</span><h3>${book.title}</h3><p>${book.teaser}</p><p class="book-reading-time">${book.readingTime}</p><div class="book-card-actions"><strong>${price} / kniha</strong>${button(book.id)}</div></div></article>`;
  window.PIXELKOVIA_BOOK_PREVIEWS={cover,button,card};
  let dialog,opener,previousOverflow;
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-book-preview]');
    if(!trigger)return;
    const selection=trigger.dataset.bookPreview==='collection'?books:books.filter(b=>b.id===trigger.dataset.bookPreview);
    if(!selection.length)return;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='book-preview-dialog';dialog.className='book-preview-dialog';dialog.setAttribute('aria-labelledby','book-preview-title');
      document.body.append(dialog);
      dialog.addEventListener('click',e=>{if(e.target.closest('[data-close-book-preview]'))dialog.close();if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
      dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;opener?.focus({preventScroll:true});});
    }
    dialog.innerHTML=`<div class="book-preview-top"><h2 id="book-preview-title">${selection.length===2?'Dvojdielna knižná kolekcia Pixelkov':selection[0].title}</h2><button type="button" data-close-book-preview aria-label="Zavrieť ukážku" autofocus>×</button></div>${selection.map(book=>`<section class="book-preview-content"><div class="book-preview-intro">${cover(book)}<div><p class="preview-when">${book.when}</p><h3>${book.title}</h3><p>${book.readingTime}</p></div></div><p class="book-preview-description">${book.teaser}</p><p class="book-preview-independence">Tri uzavreté rozprávky. Knihu môžete čítať aj bez hry.</p><div class="book-preview-pages">${book.previews.map((src,i)=>`<figure><img src="${src}" width="720" height="900" alt="${book.title}: krátka ukážka vnútra ${i+1}" loading="lazy"><figcaption>Ukážka ${i+1} z 2</figcaption></figure>`).join('')}</div><a class="book-sample-link" href="book-${book.key}-sample.html">Prečítať krátku textovú ukážku →</a></section>`).join('')}`;
    opener=trigger;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;
  });
})();
