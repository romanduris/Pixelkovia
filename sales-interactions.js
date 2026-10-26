/* Sales-only interactions, shared by the private preview and public static funnel. */
(() => {
  'use strict';
  function initGallery(gallery){
    const track=gallery.querySelector('.family-gallery-track');
    const slides=[...track.children],dots=[...gallery.querySelectorAll('[data-gallery-dot]')];
    const previous=gallery.querySelector('[data-gallery-prev]'),next=gallery.querySelector('[data-gallery-next]');
    const status=gallery.querySelector('.gallery-status');
    let current=0,frame=0;
    const positions=()=>slides.map(slide=>Math.min(slide.offsetLeft-slides[0].offsetLeft,track.scrollWidth-track.clientWidth));
    const update=()=>{
      frame=0;
      const stops=positions();
      const index=stops.reduce((best,x,i)=>Math.abs(x-track.scrollLeft)<Math.abs(stops[best]-track.scrollLeft)?i:best,0);
      current=index;
      dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
      previous.setAttribute('aria-disabled',String(index===0));next.setAttribute('aria-disabled',String(index===slides.length-1));
      status.textContent=`Obrázok ${index+1} z ${slides.length}`;
    };
    const go=index=>track.scrollTo({left:positions()[Math.max(0,Math.min(slides.length-1,index))],behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    previous.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
    track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
    gallery.addEventListener('keydown',event=>{
      const index={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:slides.length-1}[event.key];
      if(index!==undefined){event.preventDefault();go(index);}
    });
    new ResizeObserver(()=>{track.scrollTo({left:positions()[current],behavior:'instant'});update();}).observe(track);
    update();
  }
  function init(){
    if(document.body.dataset.environment!=='sales')return;
    document.querySelectorAll('[data-family-gallery]').forEach(initGallery);
    const bar=document.querySelector('.mobile-buy'),dialog=document.querySelector('#sales-preview');
    if(!bar||bar.dataset.ready)return;
    bar.dataset.ready='true';
    const targets=[...document.querySelectorAll('.funnel-hero .funnel-cta,.funnel-offer-card>.funnel-cta,.funnel-final>.funnel-cta')];
    const update=()=>{
      const narrow=matchMedia('(max-width:700px)').matches;
      const visible=targets.some(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>0;});
      const keepFocused=bar.contains(document.activeElement);
      bar.hidden=!narrow||(visible&&!keepFocused);
      document.documentElement.classList.toggle('sales-bar-visible',!bar.hidden);
    };
    const observer=new IntersectionObserver(update,{threshold:[0,1]});targets.forEach(el=>observer.observe(el));
    window.addEventListener('resize',update,{passive:true});
    bar.addEventListener('focusout',()=>queueMicrotask(update));update();
    document.addEventListener('click',event=>{
      const open=event.target.closest('[data-sales-open-preview]');
      if(open){dialog.showModal();return;}
      if(event.target.closest('[data-sales-close-preview]'))dialog.close();
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
    });
  }
  document.addEventListener('DOMContentLoaded',init,{once:true});
})();
