/* Server telemetry for the current, unchanged seven-puzzle player. */
(() => {
  const context=window.PIXELKOVIA_RUN;if(!context)return;
  const key='pixelkovia-pending-'+context.run.id;
  const finishKey='pixelkovia-finish-'+context.run.id;
  const completion=window.PIXELKOVIA_COMPLETION={status:context.run.status==='completed'?'completed':'idle',error:''};
  let latest,scheduled,sending=false,finishPending=false,finishing=null;
  try{latest=JSON.parse(localStorage.getItem(key));}catch{}
  try{finishPending=localStorage.getItem(finishKey)==='1';}catch{}
  if(completion.status==='completed'){
    finishPending=false;latest=null;
    try{localStorage.removeItem(finishKey);localStorage.removeItem(key);}catch{}
  }
  const post=async(path,input,keepalive=false)=>{const r=await fetch('/api/customer/'+path,{method:'POST',credentials:'same-origin',keepalive,headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:context.run.id,...input})});const value=await r.json().catch(error=>{if(r.ok)throw error;return null;});if(!r.ok)throw Error(typeof value?.error==='string'?value.error:'Postup sa nepodarilo uložiť. Skontrolujte internet a skúste to znova.');return value;};
  const notifyCompletion=(status,error='')=>{completion.status=status;completion.error=error;window.dispatchEvent(new Event('pixelkovia-completion'));};
  async function flush(){
    if(sending||!latest)return;
    sending=true;const snapshot=latest;
    try{await post('sync',{progress:snapshot,visible:document.visibilityState==='visible'});if(latest===snapshot){latest=null;try{localStorage.removeItem(key);}catch{}}}
    finally{sending=false;}
  }
  window.PIXELKOVIA_TRACK=progress=>{if(completion.status==='completed')return;latest=progress;try{localStorage.setItem(key,JSON.stringify(progress));}catch{}clearTimeout(scheduled);scheduled=setTimeout(()=>flush().catch(()=>{}),300);};
  window.PIXELKOVIA_SAVE=async()=>{
    clearTimeout(scheduled);
    while(sending||latest){
      if(sending){await new Promise(resolve=>setTimeout(resolve,100));continue;}
      await flush();
    }
  };
  // Only the finale's ended event queues completion. Replays reuse the same result.
  window.PIXELKOVIA_COMPLETE=()=>{
    if(completion.status==='completed')return Promise.resolve();
    if(finishing)return finishing;
    finishPending=true;try{localStorage.setItem(finishKey,'1');}catch{}
    clearTimeout(scheduled);notifyCompletion('saving');
    // Include the last snapshot so a separate failed sync cannot lose task seven.
    finishing=post('finish',latest?{progress:latest}:{},true).then(result=>{
      context.run.status='completed';context.run.completed_at=result.run.completed_at;
      finishPending=false;latest=null;
      try{localStorage.removeItem(finishKey);localStorage.removeItem(key);}catch{}
      notifyCompletion('completed');
    }).catch(error=>{notifyCompletion('failed',error.message);throw error;}).finally(()=>{finishing=null;});
    return finishing;
  };
  window.PIXELKOVIA_FINISH=async()=>{
    if(finishPending)await window.PIXELKOVIA_COMPLETE();
    else if(completion.status!=='completed')await window.PIXELKOVIA_SAVE();
    location.assign(completion.status==='completed'?'/Supervisor#hodnotenie':'/Supervisor');
  };
  const retry=()=>{if(finishPending)window.PIXELKOVIA_COMPLETE().catch(()=>{});else flush().catch(()=>{});};
  setInterval(()=>{if(document.visibilityState==='visible')retry();},20000);
  window.addEventListener('online',retry);
  window.addEventListener('pagehide',()=>{if(finishPending)window.PIXELKOVIA_COMPLETE().catch(()=>{});});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&latest)fetch('/api/customer/sync',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:context.run.id,progress:latest,visible:false})}).catch(()=>{});});
  if(finishPending)queueMicrotask(retry);
})();
