/* Reading preference only; game progress and authored book content are untouched. */
(() => {
  'use strict';
  const key='pixelkovia-atlas-reading-theme';
  let theme='light';
  try{if(localStorage.getItem(key)==='dark')theme='dark';}catch{}
  const apply=()=>{document.documentElement.dataset.readingTheme=theme;};
  apply();
  document.addEventListener('DOMContentLoaded',()=>{
    const header=document.querySelector('.atlas-header');
    if(!header)return;
    const button=document.createElement('button');
    button.type='button';button.className='atlas-reading-toggle';
    const update=()=>{
      button.textContent=theme==='dark'?'☀ Svetlý režim':'☾ Tmavý režim';
      button.setAttribute('aria-pressed',String(theme==='dark'));
      button.setAttribute('aria-label',theme==='dark'?'Zapnúť svetlý režim čítania':'Zapnúť tmavý režim čítania');
      button.setAttribute('aria-controls','tajny-svet encyklopedia');
    };
    button.addEventListener('click',()=>{
      theme=theme==='dark'?'light':'dark';apply();update();
      try{localStorage.setItem(key,theme);}catch{}
    });
    update();header.insertBefore(button,header.querySelector('.atlas-back'));
  },{once:true});
})();
