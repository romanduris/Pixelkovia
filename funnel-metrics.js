/* First-party measurements only after explicit analytics consent.
   Sessions stay in sessionStorage; an optional 90-day random browser ID deduplicates visits. */
(()=>{
  'use strict';
  if(!['/','/index.html','/checkout','/checkout.html'].includes(location.pathname))return;
  const visitKey='pixelkovia-funnel-session-v1',browserKey='pixelkovia-analytics-browser-v1';let current=null,entryHandled=false,checkoutOpenId=null;
  const landing=!location.pathname.startsWith('/checkout');
  let pageId=null,pageVisit=null,diagnosticTimer=null,diagnosticSends=0,failureReported=false;
  const diagnosticFlags={};
  const read=key=>{try{return JSON.parse(sessionStorage.getItem(key));}catch{return null;}};
  const write=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  function device(){if(navigator.userAgentData?.mobile)return 'mobile';const ua=navigator.userAgent;return /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'tablet':/Mobi|iPhone|iPod/i.test(ua)?'mobile':ua?'desktop':'unknown';}
  function operatingSystem(){
    const ua=navigator.userAgent||'';
    if(/iPad|iPhone|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return 'ios';
    const platform=navigator.userAgentData?.platform?.toLowerCase(),known={android:'android',windows:'windows',macos:'macos','chrome os':'chromeos',linux:'linux',ios:'ios'};
    if(Object.hasOwn(known,platform))return known[platform];
    for(const [pattern,os]of [[/Windows Phone/i,'windows'],[/Android/i,'android'],[/CrOS/i,'chromeos'],[/Windows/i,'windows'],[/Macintosh|Mac OS X/i,'macos'],[/FreeBSD|OpenBSD|NetBSD|BlackBerry|BB10|Tizen|webOS/i,'other'],[/Linux|X11/i,'linux']])if(pattern.test(ua))return os;
    return 'unknown';
  }
  function environment(){
    const ua=navigator.userAgent||'',brands=navigator.userAgentData?.brands?.map(b=>b.brand).join(' ')||'';
    const inApp=/Instagram/i.test(ua)?'instagram':/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)?'facebook':/\bwv\b|WebView/i.test(ua)?'other':'unknown';
    const browser=/Edg(?:e|A|iOS)?\//i.test(ua)||/Microsoft Edge/i.test(brands)?'edge':/Firefox\/|FxiOS\//i.test(ua)||/Firefox/i.test(brands)?'firefox':/OPR\/|Opera|SamsungBrowser\//i.test(ua)?'other':/Chrome\/|CriOS\//i.test(ua)||/Google Chrome/i.test(brands)?'chrome':/Safari\//i.test(ua)&&/Version\//i.test(ua)?'safari':ua?'other':'unknown';
    return {browser,inApp};
  }
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
    return {source,entrySource:s==='an'&&paid?'audience_network_ads':source,campaign:/^[a-zA-Z0-9_. -]{1,80}$/.test(campaign)?campaign:''};
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
    const socialEntry=['facebook','facebook_ads','instagram','instagram_ads','meta','audience_network_ads'].includes(entry.entrySource);
    const newEntry=!entryHandled&&v&&socialEntry&&((v.entrySource||v.source)!==entry.entrySource||v.campaign!==entry.campaign);
    entryHandled=true;
    if(!v||typeof v!=='object'||!Number.isFinite(v.lastAt)||at-v.lastAt>1800000||at<v.lastAt||newEntry)v={visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),...entry,device:device(),lastAt:at};
    v.lastAt=at;v.browserId=browserId();v.os??=operatingSystem();
    const client=environment();v.browser??=client.browser;v.inApp??=client.inApp;v.entrySource??=v.source;
    if(!write(visitKey,v))return null;return v;
  }
  function diagnostic(){
    if(!landing||!current)return undefined;
    if(pageVisit!==current.visitId){pageId=crypto.randomUUID();pageVisit=current.visitId;diagnosticSends=0;failureReported=false;}
    const nav=window.performance?.getEntriesByType?.('navigation')?.[0],coarse=value=>Number.isFinite(value)&&value>0?Math.min(120000,Math.round(value/100)*100):null;
    return {page:'/',pageId,htmlLoaded:document.readyState!=='loading',...diagnosticFlags,...window.PixelkoviaMeta?.diagnostic,
      ttfbMs:coarse(nav?.responseStart),domMs:coarse(nav?.domContentLoadedEventEnd),loadMs:coarse(nav?.loadEventEnd)};
  }
  function payload(){
    const {visitId,visitorId,browserId,source,entrySource,campaign,device,os,browser,inApp}=current;
    return {visitId,visitorId,browserId,source,entrySource,campaign,device,os,browser,inApp,type:landing?'visit':'checkout',mode:'session',...(landing?{diagnostic:diagnostic()}:{})};
  }
  function reportDiagnostic(){
    if(!landing||diagnosticTimer||!current||!window.PixelkoviaConsent?.allows('analytics'))return;
    diagnosticTimer=setTimeout(()=>{
      diagnosticTimer=null;
      if(!current||!window.PixelkoviaConsent?.allows('analytics')||diagnosticSends>=6)return;
      diagnosticSends++;
      try{void fetch('/api/marketing/event',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload(),mode:'diagnostic'}),keepalive:true,signal:AbortSignal.timeout(4000)}).catch(()=>{});}catch{}
    },250);
  }
  function collect(){
    if(!window.PixelkoviaConsent?.allows('analytics')){current=null;if(window.PixelkoviaConsent&&!window.PixelkoviaConsent.pending){try{sessionStorage.removeItem(visitKey);}catch{}try{localStorage.removeItem(browserKey);}catch{}}return;}
    try{current=visit();}catch{current=null;}if(!current)return;
    const event=payload();
    // One ID per loaded checkout document. Visibility/consent callbacks and
    // retries reuse it; a reload or new navigation is a new opening.
    if(event.type==='checkout')event.checkoutOpenId=checkoutOpenId??=crypto.randomUUID();
    // Network/storage failure never blocks a purchase or changes its outcome.
    const failed=()=>{if(landing&&current?.visitId===event.visitId&&!failureReported){failureReported=true;diagnosticFlags.internalFailed=true;reportDiagnostic();}};
    try{void fetch('/api/marketing/event',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true,signal:AbortSignal.timeout(4000)}).then(response=>{if(!response.ok)failed();}).catch(failed);}catch{failed();}
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
  if(landing){
    document.addEventListener('pixelkovia:meta-diagnostic',reportDiagnostic);
    window.addEventListener('load',reportDiagnostic,{once:true});
    window.addEventListener('error',event=>{diagnosticFlags[event.target!==window?'resourceFailed':'jsFailed']=true;reportDiagnostic();},true);
    window.addEventListener('unhandledrejection',()=>{diagnosticFlags.jsFailed=true;reportDiagnostic();});
  }
})();
