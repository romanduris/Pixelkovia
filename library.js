/* Reading preference only. No payment, entitlement or game progress is stored. */
(() => {
 const key='pixelkovia-atlas-reading-theme';let dark=false;
 try{dark=localStorage.getItem(key)==='dark';}catch{}
 const button=document.querySelector('.theme-toggle');
 const apply=()=>{document.documentElement.dataset.readingTheme=dark?'dark':'light';button.textContent=dark?'Svetlé čítanie':'Tmavé čítanie';button.setAttribute('aria-pressed',String(dark));};
 apply();button.addEventListener('click',()=>{dark=!dark;apply();try{localStorage.setItem(key,dark?'dark':'light');}catch{}});
})();
