/* Only this clean document loads Meta's SDK; the checkout URL is never passed. */
(()=>{
 'use strict';
 if(parent===window||location.search||location.hash)return;
 let initialized=false,loaded=false;
 const emitted=new Set();
 const notify=type=>parent.postMessage({type},location.origin);
 window.addEventListener('message',async event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  const data=event.data;
  if(data?.type==='pixelkovia-meta-stop'){loaded=false;window.fbq?.('consent','revoke');return;}
  if(data?.type==='pixelkovia-meta-init'&&!initialized&&['/','/checkout'].includes(data.page)){
   initialized=true;
   try{
    const response=await fetch('/api/privacy/consent',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)}),config=await response.json();
    if(!response.ok||!config.choice?.marketing||config.choice.expiresAt<=Date.now()||config.pixelId!==data.pixelId)return;
    const fbq=window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};
    window._fbq=fbq;fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];
    fbq('consent','grant');fbq('set','autoConfig',false,config.pixelId);fbq('init',config.pixelId);
    const script=document.createElement('script');script.src='https://connect.facebook.net/en_US/fbevents.js';script.async=true;script.referrerPolicy='no-referrer';
    script.onload=()=>{loaded=true;fbq('track','PageView',{page_path:data.page});if(data.page==='/checkout')fbq('track','InitiateCheckout');notify('pixelkovia-meta-ready');};
    script.onerror=()=>notify('pixelkovia-meta-failed');document.head.append(script);
   }catch{notify('pixelkovia-meta-failed');}
  }
  if(data?.type==='pixelkovia-meta-purchase'&&loaded){
   const p=data.purchase;
   if(!p||!/^purchase-[a-f0-9-]{36}$/.test(p.eventId)||!Number.isFinite(p.value)||p.value<=0||p.currency!=='EUR'||emitted.has(p.eventId))return;
   emitted.add(p.eventId);
   const content_ids=Array.isArray(p.content_ids)?p.content_ids.filter(id=>['episode-1','story-book-before','story-book-after','atlas-pixelkov'].includes(id)):[];
   window.fbq('track','Purchase',{value:p.value,currency:'EUR',content_ids,content_type:'product'},{eventID:p.eventId});
  }
 });
})();
