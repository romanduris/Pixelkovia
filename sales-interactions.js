/* Sales-only interactions, shared by the private preview and public static funnel. */
(() => {
  'use strict';
  function init(){
    if(document.body.dataset.environment!=='sales')return;
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
