/* Server telemetry for the current, unchanged seven-puzzle player. */
(() => {
  const context=window.PIXELKOVIA_RUN;if(!context)return;
  const key='pixelkovia-pending-'+context.run.id;
  let latest,scheduled,sending=false;
  try{latest=JSON.parse(localStorage.getItem(key));}catch{}
  const post=async(path,input)=>{const r=await fetch('/api/customer/'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:context.run.id,...input})});const value=await r.json().catch(error=>{if(r.ok)throw error;return null;});if(!r.ok)throw Error(typeof value?.error==='string'?value.error:'Postup sa nepodarilo uložiť. Skontrolujte internet a skúste to znova.');return value;};
  async function flush(){
    if(sending||!latest)return;
    sending=true;const snapshot=latest;
    try{await post('sync',{progress:snapshot,visible:document.visibilityState==='visible'});if(latest===snapshot){latest=null;try{localStorage.removeItem(key);}catch{}}}
    finally{sending=false;}
  }
  window.PIXELKOVIA_TRACK=progress=>{latest=progress;try{localStorage.setItem(key,JSON.stringify(progress));}catch{}clearTimeout(scheduled);scheduled=setTimeout(()=>flush().catch(()=>{}),300);};
  window.PIXELKOVIA_SAVE=async()=>{
    clearTimeout(scheduled);
    while(sending||latest){
      if(sending){await new Promise(resolve=>setTimeout(resolve,100));continue;}
      await flush();
    }
  };
  window.PIXELKOVIA_FINISH=async()=>{
    // A missing task record or failed telemetry sync must not block the finale.
    try{await window.PIXELKOVIA_SAVE();}catch{}
    await post('finish',{});location.assign('/Supervisor#hodnotenie');
  };
  setInterval(()=>{if(document.visibilityState==='visible')flush().catch(()=>{});},20000);
  window.addEventListener('online',()=>flush().catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&latest)fetch('/api/customer/sync',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:context.run.id,progress:latest,visible:false})}).catch(()=>{});});
})();
