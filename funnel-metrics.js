/* First-party measurements only after explicit analytics consent.
   Sessions stay in sessionStorage; an optional 90-day random browser ID deduplicates visits. */
(()=>{
  'use strict';
  if(!['/','/index.html','/checkout','/checkout.html'].includes(location.pathname))return;
  const visitKey='pixelkovia-funnel-session-v1',browserKey='pixelkovia-analytics-browser-v1';let current=null;
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
  const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
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
  function browserId(){
    try{
      const at=Date.now();let saved=JSON.parse(localStorage.getItem(browserKey));
      if(!saved||!/^[a-f0-9-]{36}$/.test(saved.id)||!Number.isFinite(saved.expiresAt)||saved.expiresAt<=at||saved.expiresAt>at+90*86400000){saved={id:crypto.randomUUID(),expiresAt:at+90*86400000};localStorage.setItem(browserKey,JSON.stringify(saved));}
      return saved.id;
    }catch{return null;}
  }
  function visit(){
    const at=Date.now();let v=read(visitKey);
    if(!v||typeof v!=='object'||!Number.isFinite(v.lastAt)||at-v.lastAt>1800000||at<v.lastAt)v={visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),...attribution(),device:device(),lastAt:at};
    v.lastAt=at;v.browserId=browserId();if(!write(visitKey,v))return null;return v;
  }
  function collect(){
    if(!window.PixelkoviaConsent?.allows('analytics')){current=null;if(window.PixelkoviaConsent&&!window.PixelkoviaConsent.pending){try{sessionStorage.removeItem(visitKey);}catch{}try{localStorage.removeItem(browserKey);}catch{}}return;}
    try{current=visit();}catch{current=null;}if(!current)return;
    const {visitId,visitorId,browserId,source,campaign,device}=current;
    const payload={visitId,visitorId,browserId,source,campaign,device,type:location.pathname.startsWith('/checkout')?'checkout':'visit',mode:'session'};
    // Network/storage failure never blocks a purchase or changes its outcome.
    try{void fetch('/api/marketing/event',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true,signal:AbortSignal.timeout(4000)}).catch(()=>{});}catch{}
  }
  window.PixelkoviaMarketing={context(){
    if(!window.PixelkoviaConsent?.allows('analytics'))return {};
    if(!current||Date.now()-current.lastAt>1800000)collect();
    return current?{marketingVisitId:current.visitId,marketingVisitorId:current.visitorId}:{};
  }};
  document.addEventListener('pixelkovia:consent',collect);
  void window.PixelkoviaConsent?.ready.then(collect);
  collect();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)collect();});
})();
