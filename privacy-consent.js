/* Required preference cookie; optional analytics and advertising stay off by default. */
(()=>{
 'use strict';
 if(location.pathname.startsWith('/admin')||location.pathname==='/hra')return;
 const version='2026-11-10',signalKey='pixelkovia-privacy-updated';
 let choice=null,pixelId=null,saving=false,resolved=false,revision=0,previousFocus=null,channel=null,consentEnabled=true;
 // Hiding the automatic prompt never grants consent. A missing/invalid config keeps it enabled.
 const configuration=fetch('/consent-config.json',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(4000)})
  .then(response=>{if(!response.ok)throw Error('Configuration unavailable');return response.json();})
  .then(config=>{if(typeof config?.consentEnabled==='boolean')consentEnabled=config.consentEnabled;}).catch(()=>{});
 const root=document.createElement('section');root.className='privacy-panel';root.hidden=true;root.setAttribute('aria-labelledby','privacy-heading');
 root.innerHTML=`<div class="privacy-intro"><h2 id="privacy-heading">Pomôžete nám vylepšiť Pixelkoviu?</h2><p>So súhlasom meriame návštevnosť a cez Meta Pixel aj účinnosť reklám a nákupy. Voľbu môžete kedykoľvek zmeniť.</p></div><div class="privacy-options" hidden><label><input type="checkbox" name="privacy-analytics"><span><strong>Analytika návštev</strong><small>Návštevy, anonymní unikátni návštevníci a cesta na checkout.</small></span></label><label><input type="checkbox" name="privacy-marketing"><span><strong>Marketing · Meta Pixel</strong><small>Odosielanie návštev, začatia checkoutu a potvrdeného nákupu spoločnosti Meta.</small></span></label></div><div class="privacy-actions"><button type="button" data-privacy="accept">Súhlasím so všetkým</button><button type="button" data-privacy="reject">Odmietnuť nepovinné</button><button type="button" data-privacy="settings" aria-expanded="false">Upraviť nastavenia</button><button type="button" data-privacy="save" hidden>Uložiť výber</button><button type="button" data-privacy="close" hidden>Zavrieť</button></div><details class="privacy-details"><summary>Aké údaje meriame?</summary><p>Nevyhnutné úložisko zabezpečuje prihlásenie, hru, obnovu objednávky a uloženie tejto voľby na 180 dní. Voľbu môžete kedykoľvek zmeniť cez „Nastavenia súkromia“ v pätičke.</p><p>Vlastná analytika uchováva náhodnú návštevnú reláciu, zahashovaný identifikátor prehliadača, UTM zdroj a kampaň, typ zariadenia a otvorenie checkoutu najviac 366 dní. Relácia v karte sa obnoví po 30 minútach neaktivity. Náhodný analytický identifikátor v localStorage platí najviac 90 dní a slúži na rozlíšenie opakovaných návštev jedného prehliadača. Vytvorí sa až po analytickom súhlase a po jeho odvolaní sa odstráni. Po odmietnutí sa nové návštevné údaje nezbierajú.</p><p>Meta Platforms Ireland získava po marketingovom súhlase udalosti, identifikátory prehliadača, IP adresu a technické údaje potrebné na meranie a priradenie reklamy. Súbory _fbp a _fbc môžu zostať do 90 dní. Naše udalosti neposielajú e-mail, heslo, údaje karty ani platobné parametre v URL. <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Zásady ochrany údajov Meta</a>.</p><p>Záznam voľby uchovávame počas jej platnosti a najviac ďalších 180 dní. Overenie platieb a doručenie prístupu fungujú nezávisle od nepovinného merania. Otázky: <a href="mailto:miky@pixelkovia.rodulab.com">miky@pixelkovia.rodulab.com</a>.</p></details><p class="privacy-status" role="status" aria-live="polite"></p>`;
 document.body.append(root);
 const settings=root.querySelector('.privacy-options'),status=root.querySelector('.privacy-status'),analytics=root.querySelector('[name="privacy-analytics"]'),marketing=root.querySelector('[name="privacy-marketing"]');
 const button=action=>root.querySelector(`[data-privacy="${action}"]`);
 function allows(purpose){return !saving&&!!choice&&choice.version===version&&choice.expiresAt>Date.now()&&choice[purpose]===true;}
 function announce(){document.dispatchEvent(new CustomEvent('pixelkovia:consent',{detail:{analytics:allows('analytics'),marketing:allows('marketing')}}));}
 function apply(data){
  resolved=true;
  const c=data?.choice;
  choice=c&&c.version===version&&typeof c.analytics==='boolean'&&typeof c.marketing==='boolean'&&Number.isFinite(c.createdAt)&&Number.isFinite(c.expiresAt)&&c.expiresAt>Date.now()?c:null;
  pixelId=/^\d{8,20}$/.test(data?.pixelId||'')?data.pixelId:null;
  root.hidden=true;
  if(!choice)prompt();
  announce();
 }
 function prompt(){if(consentEnabled)show(false);else root.hidden=true;}
 function show(expanded=true){
  previousFocus=document.activeElement;root.hidden=false;root.dataset.expanded=String(expanded);settings.hidden=!expanded;analytics.checked=allows('analytics');marketing.checked=allows('marketing');
  button('settings').hidden=expanded;button('settings').setAttribute('aria-expanded',String(expanded));button('save').hidden=!expanded;button('close').hidden=!choice;
 }
 async function request(method='GET',body){
  const response=await fetch('/api/privacy/consent',{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Voľbu sa nepodarilo uložiť. Meranie zostáva vypnuté. Skúste to znova.');
  return response.json();
 }
 async function refresh(){
  const current=++revision;
  try{const [data]=await Promise.all([request(),configuration]);if(current===revision&&!saving)apply(data);}
  catch{await configuration;if(current===revision&&!saving){resolved=true;choice=null;prompt();announce();status.textContent='Nastavenia sa nepodarilo načítať. Nepovinné meranie je vypnuté.';}}
 }
 async function save(a,m){
  if(saving)return;saving=true;++revision;announce();status.textContent='Ukladám vašu voľbu…';
  root.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  try{
   await request('POST',{version,analytics:a,marketing:m});
   const data=await request();
   if(!data.choice||data.choice.analytics!==a||data.choice.marketing!==m)throw Error('Prehliadač neuložil voľbu. Nepovinné meranie zostáva vypnuté.');
   saving=false;apply(data);status.textContent='';
   try{localStorage.setItem(signalKey,crypto.randomUUID());}catch{}
   channel?.postMessage('changed');
   if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }catch(error){saving=false;choice=null;show(true);announce();status.textContent=error.message;}
  finally{root.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
 }
 root.addEventListener('click',event=>{
  const action=event.target.closest('[data-privacy]')?.dataset.privacy;
  if(action==='accept')void save(true,true);
  if(action==='reject')void save(false,false);
  if(action==='save')void save(analytics.checked,marketing.checked);
  if(action==='settings'){show();analytics.focus();}
  if(action==='close'&&choice){root.hidden=true;previousFocus?.focus({preventScroll:true});}
 });
 const link=document.createElement('button');link.type='button';link.className='privacy-settings-link';link.textContent='Nastavenia súkromia';
 link.addEventListener('click',()=>{show();analytics.focus();});
 (document.querySelector('footer')||document.body).append(link);
 window.PixelkoviaConsent={allows,open:()=>show(),get pixelId(){return pixelId;},get choice(){return choice;},get pending(){return !resolved||saving;},refresh};
 const changed=()=>{resolved=false;choice=null;announce();void refresh();};
 try{channel=new BroadcastChannel('pixelkovia-privacy');channel.onmessage=changed;}catch{}
 window.addEventListener('storage',event=>{if(event.key===signalKey)changed();});
 window.addEventListener('focus',()=>void refresh());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(choice?.expiresAt<=Date.now()){choice=null;announce();}void refresh();}});
 setInterval(()=>{if(choice?.expiresAt<=Date.now()){choice=null;prompt();announce();}},30000);
 window.PixelkoviaConsent.ready=refresh();
})();
