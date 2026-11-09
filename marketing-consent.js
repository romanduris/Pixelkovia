/* First-party consent manager. Collection runs only after explicit opt-in.
   No third-party analytics/advertising scripts are loaded by this MVP. */
(()=>{
  'use strict';
  if(!['/','/index.html','/checkout','/checkout.html'].includes(location.pathname))return;
  const consentKey='pixelkovia-analytics-consent-v1',visitKey='pixelkovia-marketing-visit-v1',visitorKey='pixelkovia-marketing-visitor-v1';
  const ttl=180*86400000;let current=null;
  const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const allowed=()=>{const c=read(consentKey);return c?.allowed===true&&Date.now()-c.at<ttl;};
  function device(){if(navigator.userAgentData?.mobile)return 'mobile';const ua=navigator.userAgent;return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'tablet':/Mobi|iPhone|iPod/i.test(ua)?'mobile':ua?'desktop':'unknown';}
  function attribution(){
    const p=new URLSearchParams(location.search),s=(p.get('utm_source')||'').toLowerCase(),m=(p.get('utm_medium')||'').toLowerCase();
    const paid=['paid','paid_social','paidsocial','cpc','ppc','paid-social'].includes(m),campaign=p.get('utm_campaign')||'';
    let source='unknown';
    if(['facebook','fb'].includes(s))source=paid?'facebook_ads':'facebook';
    else if(['instagram','ig'].includes(s))source=paid?'instagram_ads':'instagram';
    else if(s==='meta')source='meta';else if(s==='influencer'||m==='influencer')source='influencer';
    else if(m==='organic')source='organic';
    else if(!s&&!m&&!p.has('utm_campaign')){
      if(!document.referrer)source='direct';
      else {try{const ref=new URL(document.referrer);if(ref.origin===location.origin)source='unknown';else if(/(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com)$/.test(ref.hostname))source='organic';}catch{}}
    }
    return {source,campaign:/^[a-zA-Z0-9_. -]{1,80}$/.test(campaign)?campaign:''};
  }
  function visit(){
    if(!allowed())return null;
    const at=Date.now();let v=read(visitKey),person=read(visitorKey);
    if(!person||at-person.at>90*86400000){person={id:crypto.randomUUID(),at};if(!write(visitorKey,person))return null;}
    if(!v||at-v.lastAt>1800000||v.visitorId!==person.id)v={visitId:crypto.randomUUID(),visitorId:person.id,...attribution(),device:device(),lastAt:at};
    v.lastAt=at;if(!write(visitKey,v))return null;return v;
  }
  function collect(){
    current=visit();if(!current)return;
    const payload={...current,type:location.pathname.startsWith('/checkout')?'checkout':'visit',consent:true};
    // Network/storage failure never blocks a purchase or changes its outcome.
    try{void fetch('/api/marketing/event',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,signal:AbortSignal.timeout(4000)}).catch(()=>{});}catch{}
  }
  window.PixelkoviaMarketing={context(){
    if(!allowed())return {};
    if(!current||Date.now()-current.lastAt>1800000)collect();
    return current?{marketingVisitId:current.visitId,marketingVisitorId:current.visitorId}:{};
  }};
  const host=document.createElement('div');host.className='analytics-consent';host.setAttribute('aria-label','Nastavenie analytiky');
  const panel=document.createElement('div');panel.className='analytics-consent-panel';panel.id='analytics-consent-panel';
  panel.innerHTML='<strong>Pomôžete nám zlepšiť nákup?</strong><p>S vaším súhlasom meriame návštevy, zdroj kampane a prechod k nákupu. Používame náhodné identifikátory v tomto prehliadači; nečítame platobné údaje. Dáta zostávajú v našej analytike, najviac 366 dní. Súhlas je dobrovoľný a môžete ho tu odvolať.</p><div><button type="button" data-choice="yes">Povoliť analytiku</button><button type="button" data-choice="no">Odmietnuť</button></div>';
  const settings=document.createElement('button');settings.type='button';settings.className='analytics-consent-settings';settings.textContent='Nastavenie analytiky';settings.setAttribute('aria-controls',panel.id);
  const saved=read(consentKey);panel.hidden=!!saved&&Date.now()-saved.at<ttl;settings.setAttribute('aria-expanded',String(!panel.hidden));
  settings.addEventListener('click',()=>{panel.hidden=!panel.hidden;settings.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)panel.querySelector('button').focus();});
  panel.addEventListener('click',e=>{
    const button=e.target.closest('[data-choice]');if(!button)return;
    const yes=button.dataset.choice==='yes';write(consentKey,{allowed:yes,at:Date.now()});
    if(yes)collect();else{current=null;try{localStorage.removeItem(visitKey);localStorage.removeItem(visitorKey);}catch{}}
    panel.hidden=true;settings.setAttribute('aria-expanded','false');settings.focus();
  });
  host.append(panel,settings);document.body.append(host);collect();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&allowed())collect();});
  window.addEventListener('storage',e=>{if(e.key===consentKey&&!allowed())current=null;});
})();
