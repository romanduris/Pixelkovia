/* Sales-only advertising, isolated from checkout URLs, forms and payment secrets. */
(()=>{
 'use strict';
 const path=location.pathname.replace(/\.html$/,'');
 if(!['/','/index','/checkout'].includes(path))return;
 const page=path==='/checkout'?'/checkout':'/';
 let frame=null,ready=false,pending=null,busy=false,failedAt=0;
 const allowed=()=>window.PixelkoviaConsent?.allows('marketing')===true;
 function clearCookies(){
  const parts=location.hostname.split('.'),domains=new Set(['',location.hostname,'.'+location.hostname]);
  for(let i=1;i<parts.length-1;i++)domains.add('.'+parts.slice(i).join('.'));
  for(const name of ['_fbp','_fbc'])for(const domain of domains){
   document.cookie=`${name}=; Max-Age=0; Path=/; Secure; SameSite=Lax${domain?'; Domain='+domain:''}`;
  }
 }
 function stop(){
  frame?.contentWindow?.postMessage({type:'pixelkovia-meta-stop'},location.origin);frame?.remove();frame=null;ready=false;pending=null;clearCookies();
 }
 function start(){
  if(!allowed()){stop();return;}
  if(frame||Date.now()-failedAt<10000)return;
  // Only an actual ad click may create _fbc; never manufacture click IDs.
  const click=new URLSearchParams(location.search).get('fbclid');
  if(/^[A-Za-z0-9_-]{10,500}$/.test(click||''))document.cookie=`_fbc=fb.1.${Date.now()}.${click}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`;
  frame=document.createElement('iframe');frame.hidden=true;frame.title='Marketingové meranie po súhlase';frame.referrerPolicy='no-referrer';frame.src='/assets/meta-pixel';
  frame.addEventListener('load',()=>{if(allowed())frame?.contentWindow?.postMessage({type:'pixelkovia-meta-init',page,pixelId:window.PixelkoviaConsent.pixelId},location.origin);});
  document.body.append(frame);
 }
 async function sendPurchase(){
  if(!ready||!allowed()||!pending||busy)return;
  busy=true;const sessionId=pending;
  try{
   const response=await fetch('/api/marketing/purchase',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId}),signal:AbortSignal.timeout(15000)});
   if(!response.ok)return;
   const data=await response.json();
   if(allowed()&&ready&&data.purchase)frame?.contentWindow?.postMessage({type:'pixelkovia-meta-purchase',purchase:data.purchase},location.origin);
   if(pending===sessionId)pending=null;
  }catch{/* Advertising must never delay checkout or change a payment. */}
  finally{busy=false;}
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  if(event.data?.type==='pixelkovia-meta-ready'&&allowed()){ready=true;void sendPurchase();}
  if(event.data?.type==='pixelkovia-meta-failed'){failedAt=Date.now();frame?.remove();frame=null;ready=false;}
 });
 window.PixelkoviaMeta={purchase(sessionId){if(/^cs_(?:test_|live_)[a-zA-Z0-9]{10,200}$/.test(sessionId||'')){pending=sessionId;if(allowed())void sendPurchase();}}};
 document.addEventListener('pixelkovia:consent',start);
 void window.PixelkoviaConsent?.ready.then(start);
})();
