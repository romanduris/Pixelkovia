/* First-party measurements only after explicit analytics consent.
   Sessions stay in sessionStorage; an optional 90-day random browser ID deduplicates visits. */
(()=>{
  'use strict';
  if(!['/','/index.html','/checkout','/checkout.html'].includes(location.pathname))return;
  const visitKey='pixelkovia-funnel-session-v1',browserKey='pixelkovia-analytics-browser-v1';let current=null,entryHandled=false,checkoutOpenId=null;
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
  const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  function device(){if(navigator.userAgentData?.mobile)return 'mobile';const ua=navigator.userAgent;return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'tablet':/Mobi|iPhone|iPod/i.test(ua)?'mobile':ua?'desktop':'unknown';}
  function attribution(){
    const p=new URLSearchParams(location.search),s=(p.get('utm_source')||'').trim().toLowerCase(),m=(p.get('utm_medium')||'').trim().toLowerCase();
    const paid=['paid','paid_social','paidsocial','cpc','ppc','paid-social'].includes(m),campaign=p.get('utm_campaign')||'';
    let source='unknown';
    if(['facebook','fb'].includes(s))source=paid?'facebook_ads':'facebook';
    else if(['instagram','ig'].includes(s))source=paid?'instagram_ads':'instagram';
    else if(s==='meta')source='meta';else if(s==='influencer'||m==='influencer')source='influencer';
    else if(m==='organic')source='organic';
    else if(!s&&(!m||paid||['social','social_media','referral'].includes(m))){
      // A referrer identifies the network, not whether the click was paid.
      // Explicit campaign sources take precedence; fbclid alone proves neither.
      if(!document.referrer){if(!m&&!p.has('utm_campaign')&&!p.has('fbclid'))source='direct';}
      else {try{
        const ref=new URL(document.referrer),host=ref.hostname.toLowerCase().replace(/\.$/,'');
        if(!['https:','http:'].includes(ref.protocol)||ref.origin===location.origin)source='unknown';
        else if(/(^|\.)(facebook\.com|fb\.com)$/.test(host))source=paid?'facebook_ads':'facebook';
        else if(/(^|\.)instagram\.com$/.test(host))source=paid?'instagram_ads':'instagram';
        else if(!paid&&/(^|\.)(google\.[a-z.]+|bing\.com|search\.yahoo\.com|duckduckgo\.com)$/.test(host))source='organic';
      }catch{}}
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
    const at=Date.now(),entry=attribution();let v=read(visitKey);
    // A new identified social entry gets its own first-touch session when its
    // source/campaign differs. Never rewrite the old visit or its purchases.
    const newEntry=!entryHandled&&v&&['facebook','facebook_ads','instagram','instagram_ads','meta'].includes(entry.source)&&(v.source!==entry.source||v.campaign!==entry.campaign);
    entryHandled=true;
    if(!v||typeof v!=='object'||!Number.isFinite(v.lastAt)||at-v.lastAt>1800000||at<v.lastAt||newEntry)v={visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),...entry,device:device(),lastAt:at};
    v.lastAt=at;v.browserId=browserId();if(!write(visitKey,v))return null;return v;
  }
  function collect(){
    if(!window.PixelkoviaConsent?.allows('analytics')){current=null;if(window.PixelkoviaConsent&&!window.PixelkoviaConsent.pending){try{sessionStorage.removeItem(visitKey);}catch{}try{localStorage.removeItem(browserKey);}catch{}}return;}
    try{current=visit();}catch{current=null;}if(!current)return;
    const {visitId,visitorId,browserId,source,campaign,device}=current;
    const payload={visitId,visitorId,browserId,source,campaign,device,type:location.pathname.startsWith('/checkout')?'checkout':'visit',mode:'session'};
    // One ID per loaded checkout document. Visibility/consent callbacks and
    // retries reuse it; a reload or new navigation is a new opening.
    if(payload.type==='checkout')payload.checkoutOpenId=checkoutOpenId??=crypto.randomUUID();
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
